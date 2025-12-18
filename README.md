<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cloud.svg" width="80" height="80" alt="UniCloud Logo"/>
</p>

<h1 align="center">UniCloud</h1>

<p align="center">
  <strong>Modern Proxmox VE Dashboard</strong><br/>
  A beautiful, feature-rich web interface for managing your Proxmox Virtual Environment
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
</p>

---

## ✨ Features

### 🖥️ Instance Management
- **Virtual Machines & Containers** - Create, manage, and monitor QEMU VMs and LXC containers
- **Template-based Deployment** - Visual template selection with OS detection (Ubuntu, Debian, Windows, etc.)
- **Real-time Actions** - Start, stop, restart, and delete instances with live status updates
- **VNC Console Access** - Direct browser-based console access to your instances

### 📊 Monitoring & Analytics
- **Resource Monitoring** - Real-time CPU, memory, and network usage charts
- **Cluster Overview** - Unified view of all nodes and their health status
- **Instance Metrics** - Detailed performance graphs with historical data

### 💰 Credit & Billing System
- **Pay-as-you-go (PAYG)** - Hourly billing based on resource consumption
- **Reserved Instances** - Monthly commitment with up to 30% savings
- **Admin Credit Management** - Allocate and manage user credits
- **Usage Tracking** - Detailed transaction history and billing summaries

### 🎨 Customization
- **8 Beautiful Themes** - Midnight, Ocean, Forest, Sunset, Aurora, Neon, Lavender, Ember
- **Multi-language Support** - English and French interfaces
- **Responsive Design** - Works seamlessly on desktop and mobile

### 🔒 Security & Multi-tenancy
- **Discord OAuth** - Secure authentication via Discord
- **Role-based Access** - Admin and user permission levels
- **Instance Isolation** - Users only see their own resources
- **Resource Quotas** - Per-user limits on CPU, memory, and instances

### 🔧 Additional Features
- **Snapshot Management** - Create, rollback, and delete VM snapshots
- **PBS Integration** - Proxmox Backup Server support for backups
- **Global Search** - Quick search across all instances (Cmd+K)
- **Toast Notifications** - Real-time feedback for all actions
- **Firewall Management** - Configure security rules per instance

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Dashboard
Modern dashboard with quick stats, recent instances, and system overview.

### Instance Management
Beautiful cards with status indicators, resource usage, and quick actions.

### Theme Selection
8 unique themes with live preview in settings.

### Billing Dashboard
Credit balance, transaction history, and usage tracking.

</details>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│              Next.js 15 + React 19                      │
│         TailwindCSS + Recharts + React Query            │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│                      Backend                             │
│                    NestJS 10                             │
│          Prisma ORM + PostgreSQL + JWT                  │
└─────────────────────┬───────────────────────────────────┘
                      │ Proxmox API
┌─────────────────────▼───────────────────────────────────┐
│                   Proxmox VE                             │
│            QEMU/KVM + LXC + Storage                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **Proxmox VE** >= 7.0
- **Docker** (optional, for containerized deployment)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/your-username/unicloudovh.git
cd unicloudovh

# Copy environment files
cp .env.example .env

# Start with Docker Compose
docker-compose up -d
```

### Manual Installation

```bash
# Backend
cd api
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
npm run start:prod

# Frontend
cd ../web
npm install
npm run build
npm run start
```

---

## ⚙️ Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uniclouddb"

# Proxmox Connection
PVE_HOST="https://your-proxmox-host:8006"
PVE_TOKEN_ID="user@pve!token-name"
PVE_TOKEN_SECRET="your-token-secret"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
DISCORD_CALLBACK_URL="https://your-domain/auth/discord/callback"

# JWT
JWT_SECRET="your-secure-jwt-secret"

# Frontend
NEXT_PUBLIC_API_URL="https://your-api-domain"
```

### Optional Configuration

```env
# Proxmox Backup Server (PBS)
PBS_HOST="https://your-pbs-host:8007"
PBS_TOKEN_ID="pbs-token"
PBS_TOKEN_SECRET="pbs-secret"

# Discord Webhook (notifications)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

---

## 🛠️ Development

### Project Structure

```
.
├── api/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Discord OAuth + JWT
│   │   ├── billing/       # Credit system
│   │   ├── compute/       # VM/CT management
│   │   ├── monitoring/    # Metrics & stats
│   │   ├── proxmox/       # Proxmox API client
│   │   └── prisma/        # Database service
│   └── prisma/
│       └── schema.prisma  # Database schema
│
├── web/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities & API client
│   └── public/
│
├── docker-compose.yml      # Development setup
└── docker-compose.prod.yml # Production setup
```

### Running Locally

```bash
# Start database
docker-compose up -d postgres

# Backend (terminal 1)
cd api
npm run start:dev

# Frontend (terminal 2)
cd web
npm run dev
```

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Format
npm run format
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Proxmox VE](https://www.proxmox.com/) - The hypervisor platform
- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide](https://lucide.dev/) - Icons

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/your-username">Unishadow</a>
</p>
