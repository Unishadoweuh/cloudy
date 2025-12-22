# Cloudy Dashboard - Handoff Document

## Current State

**Version**: 0.3.0  
**Last Updated**: 2025-12-11  
**Original Dev**: Windows → **Continuing on**: macOS

---

## Project Structure

```
cloud_proxmox/
├── api/                    # NestJS Backend (Port 3002)
│   └── src/
│       ├── proxmox/        # Proxmox API wrapper
│       ├── compute/        # Instance endpoints
│       └── storage/        # Storage endpoints
├── web/                    # Next.js Frontend (Port 3000)
│   └── src/
│       ├── app/dashboard/  # Dashboard pages
│       ├── lib/            # API client, types, i18n
│       └── components/     # UI components (shadcn/ui)
└── docker-compose.yml      # Container config
```

---

## How to Run (macOS)

```bash
# Clone or sync the project to your Mac
# Navigate to the project directory

# Backend
cd ~/path/to/cloud_proxmox/api
npm install
npm run start:dev
# Runs on http://localhost:3002

# Frontend (new terminal)
cd ~/path/to/cloud_proxmox/web
npm install
npm run dev
# Runs on http://localhost:3000
```

> **Note**: Paths are relative. Replace `~/path/to/cloud_proxmox` with your actual project location.

---

## Environment Variables

Create these files if they don't exist:

**api/.env**
```env
PROXMOX_API_URL=https://your-proxmox-server:8006
PROXMOX_API_TOKEN=user@pam!tokenid=secret-token-value
```

**web/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

---

## Completed Features ✅

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Docker setup | ✅ Done |
| 2 | Instances (CRUD, actions) | ✅ Done |
| 2 | VM + LXC creation wizard | ✅ Done |
| 3 | Storage pools & volumes | ✅ Done |
| - | Dark theme UI | ✅ Done |
| - | Settings + i18n (FR/EN) | ✅ Done |

---

## Remaining Work 📋

### Phase 4: Networks
- Add network endpoints to `api/src/proxmox/proxmox.service.ts`
- Create `NetworkModule` (like StorageModule)
- Create `web/src/app/dashboard/networks/page.tsx`
- Enable sidebar link in `web/src/app/dashboard/layout.tsx`

### Phase 5: Monitoring
- Integrate Recharts for CPU/RAM graphs
- Add monitoring tab to instance detail page
- Create `/dashboard/monitoring` page

### Phase 6: Security
- Firewall rules management
- Security groups

### Phase 7: Auth
- User authentication
- Role-based access control

### UI Polish
- Apply translations to all pages
- Light theme (placeholder exists in settings)
- Notification center

---

## Key Files Reference

### Backend (api/src/)
| File | Purpose |
|------|---------|
| `proxmox/proxmox.service.ts` | Core Proxmox API wrapper with all methods |
| `compute/compute.controller.ts` | Instance REST endpoints |
| `storage/storage.controller.ts` | Storage REST endpoints |
| `app.module.ts` | Module registration |

### Frontend (web/src/)
| File | Purpose |
|------|---------|
| `lib/api.ts` | Axios HTTP client functions |
| `lib/types.ts` | TypeScript interfaces |
| `lib/language-context.tsx` | i18n with FR/EN translations |
| `app/dashboard/layout.tsx` | Sidebar navigation (uses translations) |
| `app/dashboard/instances/page.tsx` | Instances list with grid/table |
| `app/dashboard/volumes/page.tsx` | Storage pools & volumes |
| `app/dashboard/settings/page.tsx` | Language switcher |
| `components/providers.tsx` | Query + Language providers |

---

## Tech Stack

- **Backend**: NestJS, Axios, Prisma
- **Frontend**: Next.js 14+, React, TanStack Query, Zustand
- **UI**: TailwindCSS, shadcn/ui, Lucide icons
- **i18n**: Custom context (`useLanguage()` hook)

---

## Notes for Claude / Gemini on Mac

1. **Paths**: All file paths in this project are relative. No hardcoded Windows paths.
2. **Node version**: Use Node.js 18+ (check with `node -v`)
3. **npm vs pnpm**: Project uses npm. Don't mix package managers.
4. **Proxmox mock data**: If no Proxmox server is available, the API returns mock data automatically.
5. **Ports**: API runs on 3002, Web on 3000. Check for conflicts.
6. **Hot reload**: Both `npm run start:dev` (API) and `npm run dev` (Web) support hot reload.
