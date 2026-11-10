---
title: Beyond this machine
nav: Beyond this machine
summary: The bind, the password, TLS behind a proxy, and the two guards that keep a visited web page from driving your agents.
---

# Beyond this machine

The cockpit runs arbitrary commands on its host **by design** — that is what an
agent is. So it binds `127.0.0.1`, this machine only, until you say otherwise.

Opening it up is two settings and a handful of things to know.

## The bind needs a password

`SHADOK_HOST=0.0.0.0` **requires** a password — `--password`, or
`SHADOK_GUI_PASSWORD`. Without one the server **refuses to start**, rather than
hand the network a shell.

That password is the `admin` account: with it set, the login page gains a user
field, and an admin can invite other people. [People and
accounts](/docs/accounts) covers invitations, roles and two-factor sign-in.

In a container, `0.0.0.0` is the only value that works, and the port should be
published on the host's loopback. See [Docker](/docs/docker#two-things-about-the-network).

## Browsers may only talk to it from its own origin

A WebSocket ignores the same-origin policy, so without a check, **any page you
happen to visit** could drive your agents. The server refuses a browser whose
`Origin` is not the request's own `Host`.

Behind a reverse proxy that rewrites `Host`, list the public origin in
`SHADOK_ORIGINS`.

> **Origin-less clients are let through on purpose.** The Telegram bridge, the
> CLI, the scheduler and agents' own tooling open loopback connections with no
> `Origin` header at all; tightening that branch to a deny would cut Telegram off
> from its own sessions. The bind and the password are what stop a network
> attacker — this guard only ever addresses browsers.

## Which host names it answers

A page on `evil.com` can re-point its own name at `127.0.0.1`. Its requests then
carry `Origin` **and** `Host` as `evil.com:3789` and look same-origin. So the
server also checks the `Host` header, on every request and on the WebSocket
upgrade:

- **No password** — the local default: only `localhost`, `*.localhost`, any IP
  address, and this machine's own name (`hostname`, `hostname.local`) are
  answered, on any port. Anything else gets `403 host not allowed` and one log
  line. If you really reach a password-less cockpit through another name — an
  `/etc/hosts` alias, a same-host proxy — add it to `SHADOK_ALLOWED_HOSTS`.
- **With a password** — every `Host` is answered, as before. A rebound page holds
  no cookie for your cockpit, so it is a stranger at the login page, and this is
  what keeps a container behind nginx or Cloudflare on its own domain working
  with no change. Setting `SHADOK_ALLOWED_HOSTS` then tightens it to that list.

`SHADOK_ALLOWED_HOSTS` is comma-separated: names, `host:port` or whole origins
(the port is ignored), `.example.com` for a domain and its subdomains, `*` to
switch the check off. Loopback names and IPs always stay allowed — agents call
`127.0.0.1`. The hosts in `SHADOK_ORIGINS` are accepted too.

## Sign-in attempts are limited

A failed `POST /login` is counted against the caller's address (10 per 15
minutes) and against the account (20 per 15 minutes, from every address
together). Past that the answer is `429` with a `Retry-After`, **before** any
password is checked. Enrollment codes are counted the same way.

An unknown user name costs the server exactly what a real one does, so the
timing says nothing about which accounts exist. The counters live in memory, so
a restart clears them.

Behind a proxy, the address is the one the proxy appended last to
`X-Forwarded-For` — trusted only when the proxy connects from this machine or a
private range. A proxy that sends no `X-Forwarded-For` puts every visitor in one
bucket, so ten wrong passwords from anyone lock the login for everyone for
fifteen minutes.

## Behind TLS

Serving the cockpit over HTTPS works, with one requirement: **the proxy must
forward the WebSocket upgrade**. Everything live travels over `/ws` and the page
itself is static, so a proxy that drops `Upgrade`/`Connection` produces a
cockpit that loads perfectly and then never connects.

```nginx
location / {
    proxy_pass http://127.0.0.1:3789;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 50m;
}
```

The client picks `wss://` on its own when the page is HTTPS, so there is nothing
to configure on that side. Four details in that block earn their place:

- **Forward the client address.** An agent authenticates to its own server with
  a session key that never expires, so the server accepts that key **only from
  this machine, directly** — never from the network, where a key leaked by a
  prompt-injected agent would otherwise be permanent admin. A proxy on the same
  host connects from `127.0.0.1` too; the `X-Forwarded-For` line is what tells
  the server the request was relayed. Without it, requests through a same-host
  proxy look local.
- **Secure cookies.** With `X-Forwarded-Proto: https` from a proxy on this
  machine or a private range, the session cookies are set `Secure`, so a browser
  never sends them over plain http.
- **Upload size.** The server accepts a pasted or dropped file up to 50 MB, but
  nginx's default `client_max_body_size` is **1 MB** — a full-page screenshot
  sails past it, and nginx answers its own `413` page before the request ever
  reaches the cockpit.
- **Idle timeout.** A resting agent's socket carries no traffic, and proxies
  idle-close a quiet one (nginx 60s by default, Cloudflare around 100s); the
  symptom is a cockpit that keeps flashing "reconnecting…" with nothing actually
  wrong. The server sends a ping every 25s to keep it warm
  (`SHADOK_WS_PING_MS`), so normally no proxy change is needed. If yours still
  cuts it, raise `proxy_read_timeout` above the ping interval.

## Sleep, wake, and network blips

When the machine comes back, the cockpit revives the links that actually
**dropped** and leaves the ones that still report open alone.

That asymmetry is deliberate. The browser's `online` event fires on every blip —
a wifi roam, a VPN, an interface change — and force-reconnecting healthy links
on each one reconnected every agent at once, tripping the upstream single-use
token refresh so a batch of them stuck on "connecting…". A slept socket that
looks open but is dead is terminated by the server's own heartbeat instead, and
reconnects on the resulting close without that churn.
