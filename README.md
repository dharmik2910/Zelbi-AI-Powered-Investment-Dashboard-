# Zelbi - AI Powered Investment Dashboard

A modern, full-stack investment dashboard application that helps investors track, analyze, and manage their investments efficiently.

## 🌟 Features

- **User Authentication & Authorization**
  - Secure login and signup system
  - Email verification
  - Password reset functionality
  - Profile management

- **Investment Dashboard**
  - Real-time investment tracking
  - Portfolio analytics
  - Investment history

- **AI-Powered Insights**
  - Smart investment recommendations
  - Market trend analysis
  - Risk assessment
  - Predictive analytics

- **Project Management**
  - Investment project tracking
  - Document management

## 🛠️ Tech Stack

### Frontend
- React.js
- Redux Toolkit
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Cloudinary for Image Storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/dharmik2910/Zelbi---An-Investor-Dashboard.git
```

2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

3. Install Backend Dependencies
```bash
cd ../backend
npm install
```

4. Set up environment variables
- Create `.env` files in both frontend and backend directories
- Add necessary environment variables (see `.env.example`)

5. Start the Development Servers

Frontend:
```bash
cd frontend
npm start
```

Backend:
```bash
cd backend
npm run dev
```

## 📝 Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=your_backend_url
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
REACT_APP_GTM_ID=GTM-XXXXXXX     # optional, Google Tag Manager container for Google Analytics
```

### Backend (.env)
```
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/zelbi?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
SMTP_MAIL_USERNAME=your_smtp_username
SMTP_MAIL_PASSWORD=your_smtp_password
SMTP_MAIL_FROM=your_smtp_from
SMTP_MAIL_HOST=your_smtp_host
SMTP_MAIL_PORT=your_smtp_port
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=https://your-frontend-domain      # used for CORS and password reset links
GOOGLE_CLIENT_ID=your_google_oauth_client_id   # same value as REACT_APP_GOOGLE_CLIENT_ID
TWELVEDATA_API_KEY=your_twelvedata_api_key     # market data is proxied through /api/market
NODE_ENV=production                            # enables secure cookies (requires HTTPS)
ALERT_CHECK_INTERVAL_MS=300000                 # optional, how often price alerts are checked
ALERT_SYMBOLS_PER_RUN=8                        # optional, symbols checked per run (TwelveData rate limit)
MAIL_FROM=you@yourdomain.com                   # optional, sender address for emails
BREVO_WEBHOOK_SECRET=long_random_string        # optional, enables delivery status in the admin email log
GEMINI_INPUT_USD_PER_M=0.30                    # optional, AI cost estimate (USD per million input tokens)
GEMINI_OUTPUT_USD_PER_M=2.50                   # optional, AI cost estimate (USD per million output tokens)
GITHUB_REPO=owner/repo                         # optional, enables "Deploy now" in the admin Server section
GITHUB_DEPLOY_TOKEN=github_pat_xxx             # optional, fine-grained token with Actions read/write on that repo
```

### Email delivery tracking (optional)

The admin panel logs every email Zelbi sends. To also see whether emails were delivered, bounced or opened:

1. Set `BREVO_WEBHOOK_SECRET` in the backend `.env` to a long random string and restart the backend.
2. In Brevo, go to **Transactional > Settings > Webhook** and add
   `http://<your-site>/api/webhooks/brevo?token=<BREVO_WEBHOOK_SECRET>`.
3. Select the events: delivered, opened, clicked, soft bounce, hard bounce, blocked, spam, invalid email, deferred, error.

### Deploy from the admin panel (optional)

The admin **Server** section shows server health, backend logs and a restart button. To also enable **Deploy now**:

1. On GitHub, create a fine-grained personal access token (Settings > Developer settings > Fine-grained tokens) for this repository only, with **Actions: Read and write**.
2. Add to the backend `.env` (and the `BACKEND_ENV` secret): `GITHUB_REPO=owner/repo` and `GITHUB_DEPLOY_TOKEN=<token>`.

### Admin access

Make a user an admin from the `backend` folder: `npm run make-admin -- someone@example.com` (add `--remove` to undo).


