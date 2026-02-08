# Buy Me a Coffee (Stripe) Setup

QuickQuote uses **Stripe Payment Links** for the "Buy me a coffee" button. No secret keys go in your code — only the public payment link.

---

## 1. Create a Stripe Payment Link

1. Log in at [dashboard.stripe.com](https://dashboard.stripe.com).
2. Go to **Product catalog** → **Payment links** → **New**.
3. Add a one-time product (e.g. "Buy me a coffee", $5).
4. Create the link and copy the URL (e.g. `https://buy.stripe.com/...`).

---

## 2. Add the link to your site

In `index.html`, find the support button and replace `href="#"` with your Payment Link URL:

```html
<a id="supportLink" href="https://buy.stripe.com/your-link-here" class="btn btn-support" ...>
```

The "Buy me a coffee" section is hidden until the link is set (when `href` is not `#`).

---

## Is it safe to put the link in the repo?

**Yes.** Stripe Payment Links are meant to be public — like a "Pay here" URL. Putting the link in your site or in git does not expose any secret keys. Never put your **secret key** (sk_live_...) anywhere; only the Payment Link URL is used.
