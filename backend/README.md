
A Node.js + Express REST API for the ThyroCare AI-powered thyroid health platform.




- [Node.js](https://nodejs.org/) v18+
- A PostgreSQL database (local or remote e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app))


```bash
cd backend
npm install
```


```bash
copy .env.example .env
```


```bash
npx prisma db push
npx prisma studio
```


```bash
npm start
npm run dev
```

Server runs at: **http://localhost:3000**

---



Base URL: `http://localhost:3000/api/v1`

| Module | Prefix | Auth Required |
|---|---|---|
| Auth | `/auth` | ✗ |
| User Profile | `/users` | ✓ JWT |
| Chat Sessions | `/chat` | ✓ JWT |
| Symptom Tracking | `/symptoms` | ✓ JWT |
| Articles (CMS) | `/articles` | ✓ JWT (write: admin) |
| Doctor Finder | `/doctors` | ✓ JWT |
| Advisors | `/advisors` | ✗ (read) |
| Notifications | `/notifications` | ✓ JWT |
| Admin | `/admin` | ✓ JWT + admin role |

See `tests/thyrocare.http` for a full list of all endpoints with examples.

---



| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret key for signing JWTs | — |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP email address | — |
| `EMAIL_PASS` | SMTP password / app password | — |
| `EMAIL_FROM` | Display name + email | — |
| `OTP_EXPIRY_MINUTES` | OTP validity period | `10` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Comma-separated allowed origins | — |
| `NODE_ENV` | `development` or `production` | `development` |

---



```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── email.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── controllers/
│   └── routes/
└── tests/
    └── thyrocare.http
```

---


- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT tokens expire in **7 days**
- Account locked for **30 minutes** after **5 failed login attempts**
- Rate limiting: **10 req/15 min** on auth endpoints
- **Helmet.js** sets secure HTTP headers
- CORS restricted to configured origins
