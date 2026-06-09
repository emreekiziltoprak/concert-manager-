# Event Hub - Concert Management System

A full-stack concert/event management application built with Node.js/Express backend and React/Vite frontend.
## 🗄️ Database Architecture (ERD)

The system is built on a robust PostgreSQL relational database managed by Prisma ORM. Below is the simplified Entity-Relationship Diagram:

## 🗄️ Database Architecture (ERD)

The system is built on a highly relational PostgreSQL database managed by Prisma ORM. It includes robust concurrency management, role-based access control, and a transactional outbox pattern for distributed tasks.

```mermaid
erDiagram
    USER {
        String id PK
        String email UK
        String fullName
        UserRole role
        Boolean isActive
        DateTime createdAt
    }
    EVENT {
        String id PK
        String title
        String slug UK
        DateTime startDate
        DateTime endDate
        Int capacity
        EventStatus status
        Float price
    }
    EVENT_ROLE {
        String id PK
        EventRoleType role
        DateTime assignedAt
    }
    CATEGORY {
        String id PK
        String name UK
        String slug UK
    }
    EVENT_REGISTRATION {
        String id PK
        String status
        DateTime registeredAt
    }
    TICKET_TYPE {
        String id PK
        String name
        Decimal price
        Int totalCount
        TicketCategory category
    }
    TICKET {
        String id PK
        Boolean isSold
        Boolean isUsed
        DateTime soldDate
    }
    ORDER {
        String id PK
        Decimal totalAmount
        OrderStatus status
        DateTime createdAt
    }
    ORDER_ITEM {
        String id PK
        Int quantity
        Decimal unitPrice
        Decimal totalPrice
    }
    OUTBOX_EVENT {
        String id PK
        String type
        String status
        Json payload
    }

    %% Core Event Management Relations
    USER ||--o{ EVENT : "organizes"
    CATEGORY ||--o{ EVENT : "categorizes"
    
    %% Role & Access Management Relations
    USER ||--o{ EVENT_ROLE : "acts_as"
    USER ||--o{ EVENT_ROLE : "assigned_by"
    EVENT ||--o{ EVENT_ROLE : "includes"
    
    %% Registration Relations
    USER ||--o{ EVENT_REGISTRATION : "registers"
    EVENT ||--o{ EVENT_REGISTRATION : "has_registrations"
    
    %% Ticket Inventory & Order Relations
    EVENT ||--o{ TICKET_TYPE : "provides"
    EVENT ||--o{ ORDER : "receives"
    USER ||--o{ ORDER : "places"
    ORDER ||--o{ ORDER_ITEM : "contains"
    TICKET_TYPE ||--o{ ORDER_ITEM : "defines_pricing"
    
    %% Actual Ticket Generation Relations
    USER ||--o{ TICKET : "owns"
    TICKET_TYPE ||--o{ ORDER_ITEM : "defines_pricing"
    ORDER_ITEM ||--o{ TICKET : "generates_physical_ticket"
```
## Features

-  Event creation and management
-  Category organization for events
-  User authentication (JWT-based)
-  Payment processing with Stripe
-  Interactive API documentation (Swagger)
-  Modern React frontend with Vite
-  PostgreSQL database with Prisma ORM

## Project Structure

concert-manager/
├── .env                 # Environment variables
├── package.json         # Backend dependencies and scripts
├── prisma/              # Prisma schema and migrations
├── src/                 # Backend source code
│   ├── config/          # Configuration files (Swagger, etc.)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Custom middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── server.js            # Backend entry point
└── frontend/            # Frontend application
    └── event-hub-frontend/
        ├── public/      # Static assets
        ├── src/         # React components and logic
        ├── package.json # Frontend dependencies
        └── vite.config.js # Vite configuration
```

## Technology Stack

### Backend
- **Node.js** with **Express.js**
- **Prisma** ORM with **PostgreSQL**
- **JWT** for authentication
- **Stripe** for payment processing
- **Swagger** for API documentation
- **dotenv** for environment configuration
- **cors**, **cookie-parser**, **express-validator** for middleware

### Frontend
- **React** with **Vite**
- **React Router** for navigation
- **Axios** for HTTP requests
- **Stripe JS** for payment integration
- **ESLint** for code quality

## Setup and Installation

### Prerequisites
- Node.js (v16+)
- Yarn package manager
- PostgreSQL database

### Backend Setup

1. Install backend dependencies:
   ```bash
   yarn install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env  # If .env.example exists
   # Or create .env with:
   # DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   # JWT_SECRET="your_jwt_secret_here"
   # STRIPE_SECRET_KEY="your_stripe_secret_key"
   # STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   yarn dev
   ```
   The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend/event-hub-frontend
   ```

2. Install frontend dependencies:
   ```bash
   yarn install
   ```

3. Set up frontend environment variables:
   ```bash
   cp .env.example .env.development  # If .env.example exists
   # Or create .env.development with:
   # VITE_API_URL="http://localhost:3000/api"
   # VITE_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
   ```

4. Start the frontend development server:
   ```bash
   yarn dev
   ```
   The application will be available at `http://localhost:5173`

## API Documentation

Once the backend is running, visit `http://localhost:3000/api-docs` to view the interactive Swagger API documentation.

## Available Scripts

### Backend
- `yarn dev` - Start development server with nodemon
- `yarn start` - Start production server
- `yarn test` - Run tests (currently not configured)

### Frontend
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build

## Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| JWT_SECRET | Secret for JWT token signing | `your_64_char_secret_here` |
| STRIPE_SECRET_KEY | Stripe secret key | `sk_test_...` |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | `whsec_...` |

### Frontend (.env.development)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | `http://localhost:3000/api` |
| VITE_STRIPE_PUBLISHABLE_KEY | Stripe publishable key | `pk_test_...` |

## Database Schema

The application uses Prisma ORM with the following main models:
- User: Authentication and user profiles
- Category: Event categorization
- Event: Concert/event details
- Payment: Transaction records
- Ticket: Purchased tickets for events

Run `npx prisma studio` to view and manage the database visually.

## Deployment

### Backend Deployment
1. Ensure all environment variables are set in your hosting environment
2. Run `yarn install` to install dependencies
3. Run `npx prisma migrate deploy` to apply migrations
4. Start the server with `yarn start`

### Frontend Deployment
1. Build the frontend with `yarn build`
2. Deploy the contents of the `dist` directory to your static hosting provider
3. Ensure the backend API URL is correctly configured

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Node.js, Express, React, and Vite
- Database powered by PostgreSQL and Prisma ORM
- Payments processed securely with Stripe
- API documentation generated with Swagger/OpenAPI
