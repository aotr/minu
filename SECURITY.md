# Security Policy

## Reporting a vulnerability

**Please do not open a public GitHub issue for a security vulnerability.**

Email **animesh.aotr@gmail.com** with the subject:

```text
Minu security report
```

Include:

- the affected Minu version;
- the browser and version;
- a minimal reproduction or proof of concept;
- the impact you believe is possible;
- any suggested fix, if you have one.

Please do not include exploit details in a public issue, pull request, or
discussion. If you are unsure whether something is a security issue, email
first and ask.

## What to expect

- I aim to acknowledge reports within **3 business days**.
- I will confirm whether the issue is in scope and discuss a fix and disclosure
  timeline.
- Please give a reasonable window for a fix before publishing details.
- Credit is offered in the release notes if you want it, or you can remain
  anonymous.

## Supported versions

| Version | Supported |
|---|---|
| 1.6.x | Yes |
| Earlier 1.x | Best effort; upgrade to 1.6.x |
| 0.x | No |

## Scope

Minu is an HTML fragment loader. Relevant reports include:

- a bypass of the secure build’s DOMPurify path;
- script execution or event-handler execution caused by Minu’s swapping or SSE
  handling;
- an SSRF or URL-handling flaw in the request pipeline;
- a flaw that lets one request write outside its declared target or OOB target;
- a dependency or build-pipeline compromise.

Important boundary: the default `minu.js` build strips scripts, inline event
handlers, and `javascript:` URLs, but it is **not an XSS boundary** — regex
sanitization never is. Use `minu/secure` with DOMPurify for untrusted HTML.
Reports that rely on the documented default-sanitizer limitation are not
treated as vulnerabilities, but reports of bypasses in the secure build are.

## General bugs

Non-security bugs belong in the GitHub issue tracker:
https://github.com/aotr/minu/issues

## Safe harbor

Good-faith security research is welcome. I will not pursue legal action for
research that follows this policy, stays within your own accounts and test
data, avoids privacy violations and service disruption, and gives reasonable
time to fix the issue before disclosure.
