# Event Hub - Concert Management System

A full-stack concert/event management application built with Node.js/Express backend and React/Vite frontend.

##  Database Architecture (ERD)

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

```
concert-manager/                 # (Orchestra project root)
├── docker-compose.yml           # Central command to start the whole system
├── .gitignore
└── README.md                    # Updated documentation

├── backend/                     # API (fully independent service)
│   ├── src/                     # Source code
│   ├── prisma/                 # Database schema & migrations
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Entry point
│   ├── Dockerfile              # Backend build instructions
│   ├── .dockerignore           # Files excluded from Docker context
│   └── .env                    # Backend environment variables
│
└── frontend/                   # UI (fully independent service)
    └── event-hub-frontend/
        ├── src/                # Frontend source code
        ├── public/             # Static assets
        ├── package.json       # Frontend dependencies
        ├── vite.config.js     # Vite configuration
        ├── Dockerfile         # Frontend build instructions
        ├── .dockerignore      # Files excluded from Docker context
        └── .env.development   # Frontend development environment variables
```

## Common Docker Commands

| Command | Description |
|----------|-------------|
| `docker-compose up --build` | Builds and starts all services. |
| `docker-compose down` | Stops and removes all containers. |
| `docker-compose down -v` | Stops the system and removes all volumes, including the database data. |
| `docker-compose logs -f backend` | Streams backend logs in real time. |
| `npx prisma migrate dev` | Applies database schema changes and generates a new migration. |


## Service Address
Frontend (UI)	http://localhost:5173
Backend (API)	http://localhost:3000
Database (PostgreSQL)	localhost:5433

## Accessing the Application
docker-compose down -v
docker-compose up --build

## API Documentation

Once the backend is running, visit `http://localhost:3000/api-docs` to view the interactive Swagger API documentation.


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
