# FINORA — Smart Finance. Secure Future.

FINORA is an educational digital-banking simulator built with React, TypeScript, and Vite. It demonstrates customer and administrator workflows using simulated LKR accounts, transactions, transfers, budgets, notifications, statements, and dashboard analytics.

> **Important:** FINORA is a browser-based educational simulation. It does not connect to a real bank, move real money, authenticate real banking customers, or provide production-grade financial security. Do not enter real financial credentials or rely on it for financial transactions.

## Demonstration features

- Simulated customer and administrator experiences
- Sample LKR accounts, balances, deposits, and withdrawals
- Internal transfers between simulated accounts
- Transaction history, tags, spending breakdowns, and budget goals
- Sample statements and CSV/print export workflows
- Simulated alerts, notification UI, and biometric prompts
- Dashboard charts, settings, and theme preferences
- Local browser persistence for the educational ledger

The help widget and sample data describe simulated workflows. They are not connected to banking rails, payment processors, or real compliance systems.

## Technology

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- Motion and Lucide React
- Browser `localStorage` for the demonstration ledger and preferences

## Getting started

### Requirements

- Node.js compatible with Vite 8
- npm

### Install dependencies

```bash
npm ci
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite.

### Build and type-check

```bash
npm run build
npm run lint
npm run preview
```

- `npm run build` creates the production frontend bundle.
- `npm run lint` runs the TypeScript no-emit check.
- `npm run preview` serves the built frontend locally.
- No automated test script or backend service is currently defined in `package.json`.

## Data and security limitations

- The ledger is stored in this browser's `localStorage`; it is not a shared database or a tamper-resistant financial ledger.
- Demo sign-in validates against the local educational directory. The passcode is not used to authenticate a real account, and the session is held in application memory.
- Role changes, balances, transactions, and other browser-side state can be modified by someone with access to the browser or developer tools.
- The biometric prompt and transaction alerts are simulated interface features, not real identity verification or push-notification infrastructure.
- Clearing site data or changing browsers may remove the local demonstration state.
- Do not deploy or describe this project as a real banking product without a separately designed backend, secure authentication, server-authoritative ledger, audit controls, and independent security review.

## Project status

FINORA is an educational prototype. Its purpose is to demonstrate interface design and simulated banking workflows, not to handle real customer data or funds.
