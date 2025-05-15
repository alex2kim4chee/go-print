# Go Print – Custom Apparel AI Ordering

This is a static AI-powered apparel ordering page built with **Jekyll + Cloudflare Pages + OpenAI + Stripe + Resend**.

## ✅ Features

- Step-by-step guided AI ordering assistant (GPT-4o)
- Multi-item order builder (product, color, size, method, quantity)
- Live logo upload and mockup preview (canvas-based)
- Email notification with preview image
- Stripe Checkout integration for secure payments
- Mobile-optimized interface

---

## 🚀 Deploying the Project

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/go-print.git
cd go-print
```

### 2. Enable Jekyll on Cloudflare Pages

Go to Cloudflare Pages and create a new project → Connect this GitHub repo

- **Build command:** `jekyll build`
- **Output folder:** `_site`
- **Environment variables:**
  ```
  OPENAI_API_KEY=sk-...
  RESEND_API_KEY=re_...
  STRIPE_SECRET_KEY=sk_live_...
  R2_ACCESS_KEY_ID=...
  R2_SECRET_ACCESS_KEY=...
  R2_ENDPOINT=https://YOUR_ACCOUNT.r2.cloudflarestorage.com
  R2_BUCKET_NAME=pecan-mockups
  R2_PUBLIC_URL=https://public-files.YOUR_DOMAIN.com/pecan-mockups
  ```

### 3. Stripe Settings

Enable Checkout in Stripe Dashboard

Set **success_url** and **cancel_url** to:
```
https://yourdomain.com/go-print/success
https://yourdomain.com/go-print/cancel
```

### Folder Structure

```
.
├── _layouts/
│   ├── go-print.html
│   ├── go-print-success.html
│   └── go-print-cancel.html
├── assets/
│   ├── chat.js
│   ├── styles.css
│   └── mockups/ (add your blank mockup images here)
├── functions/
│   ├── ai-handler.js
│   ├── calculate.js
│   ├── upload.js
│   └── send-preview.js
├── go-print.md
├── go-print-success.md
├── go-print-cancel.md
├── _config.yml
└── README.md
```

Customize as needed and deploy!
