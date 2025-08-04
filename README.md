# MBH Staff Portal

A comprehensive web application for Manly Boat Hire staff to manage bookings, submit availability, and complete vessel safety checklists.

## 🚤 Project Structure

```
mbh-staff-portal/
├── frontend/              # React/Next.js application (to be implemented)
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions and API clients
├── training/             # Interactive training resources
│   ├── index.html        # Main training portal
│   ├── quick-reference.html
│   ├── vessel-diagram.html
│   └── vessel-locations-map.html
├── database/             # Database schemas and migrations
│   ├── migrations/       # SQL migration files
│   └── schemas/          # Database design documentation
├── docs/                 # Project documentation
│   └── PROJECT_SUMMARY.md
├── api/                  # API integration code
└── README.md
```

## 🔧 Current Status

### ✅ Completed
- Airtable integration analysis
- Supabase database schema design and setup
- Security implementation with Row Level Security
- Interactive training portal (HTML)
- Project documentation
- Authentication system (email/password with verification)
- Staff availability submission interface (with auto-generated Submission IDs)
- Dashboard homepage with personalized welcome
- Vessel Checklists (Pre-departure & Post-departure)
- Fixed Airtable automation integration (July 2025)

### 🚧 In Progress
- Roster view for work assignments
- Real-time booking updates

### 📋 To Do
- Implement React/Next.js frontend migration
- Create server-side API integration layer
- Build real-time sync with Airtable
- Develop offline capabilities
- Deploy to production

## 🏗️ Tech Stack

- **Frontend**: HTML/JavaScript (current), React/Next.js (planned)
- **Database**: Supabase (PostgreSQL)
- **Integration**: Airtable API
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (planned)

## 📊 Database Tables

- `staff_profiles` - User authentication linking
- `availability_cache` - Weekly availability data
- `booking_cache` - Booking assignments
- `checklist_templates` - Pre/post departure items
- `completed_checklists` - Checklist submissions
- `app_settings` - Application configuration
- `sync_logs` - Airtable sync tracking

## 🔗 Key Integrations

### Airtable Bases
- **MBH Bookings Operation**: `applkAFOn2qxtu7tx`
- **Vessel Maintenance**: `appjgJmfEkisWbUKh`

### Supabase Project
- **Project ID**: `etkugeooigiwahikrmzr`
- **URL**: `https://etkugeooigiwahikrmzr.supabase.co`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase CLI (optional)
- Airtable API access

### Environment Setup
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_KEY]
AIRTABLE_API_KEY=[YOUR_KEY]
```

### Database Setup
1. Run the migration in Supabase:
```bash
cd database/migrations
# Run 001_create_mbh_staff_tables.sql in Supabase dashboard
```

### Training Portal
The training portal can be accessed directly:
```bash
cd training
python3 -m http.server 8000
# Visit http://localhost:8000
```

## 📱 Key Features

### For Staff
- Submit weekly availability with custom time slots
- View personalized dashboard with welcome message
- Complete digital pre-departure safety checklists
- Complete digital post-departure vessel inspections
- View assigned bookings (onboarding/deloading)
- Access interactive vessel location maps
- Access comprehensive training resources
- Emergency contact quick access

### For Managers
- View all staff availability submissions
- Assign staff to bookings (via Airtable)
- Monitor checklist completion status
- Track vessel usage and condition
- Review damage reports and issues
- Generate compliance reports

## 🔒 Security

- Row Level Security (RLS) on all tables
- Role-based access control
- Secure authentication flow
- API key protection
- Data encryption at rest

## 📞 Support

For questions or issues, contact:
- Technical Support: [TO BE FILLED]
- Project Manager: [TO BE FILLED]

---
*For detailed project information, see [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)* 