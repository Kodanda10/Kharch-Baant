# Kharch-Baant - Complete User Flow Analysis

## Application Overview
**Kharch-Baant** is a shared expense tracking web application that allows users to create groups, add expenses, settle balances, and manage shared costs with friends, family, or colleagues.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Backend**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini (expense categorization)
- **Email Service**: MailerSend
- **Deployment**: Vercel
- **PWA**: Progressive Web App capabilities

## Database Schema

### Core Tables
```sql
-- Users/People
people (
  id uuid PRIMARY KEY,
  name text,
  avatar_url text,
  clerk_user_id text UNIQUE,
  created_at timestamp,
  updated_at timestamp
)

-- Groups
groups (
  id uuid PRIMARY KEY,
  name text,
  currency text,
  group_type text,
  trip_start_date date,
  trip_end_date date,
  is_archived boolean,
  created_by uuid REFERENCES people(id),
  created_at timestamp
)

-- Group Memberships
group_members (
  group_id uuid REFERENCES groups(id),
  person_id uuid REFERENCES people(id),
  PRIMARY KEY (group_id, person_id)
)

-- Transactions
transactions (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES groups(id),
  description text,
  amount decimal,
  paid_by_id uuid REFERENCES people(id),
  split jsonb,
  category text,
  created_at timestamp
)

-- Payment Sources
payment_sources (
  id uuid PRIMARY KEY,
  name text,
  type text,
  created_by uuid REFERENCES people(id)
)
```

## Complete User Flow

### 1. Authentication & Onboarding

#### 1.1 Initial Access
```
User visits app → Clerk authentication check
├── If not authenticated: Redirect to Clerk sign-in
└── If authenticated: Proceed to app
```

#### 1.2 First-Time User Setup
```
User signs in → ensureUserExists() called
├── Check if user exists by clerk_user_id
├── If exists: Return existing user
├── If not found: Check for similar names
│   ├── If found: Update with clerk_user_id + merge duplicates
│   └── If not found: Create new user with clerk_user_id
└── Send welcome email (if MailerSend enabled)
```

#### 1.3 Data Loading
```
User authenticated → Load user data
├── Fetch user's groups (filtered by membership)
├── Fetch user's transactions
├── Fetch user's payment sources
├── Fetch people (users with shared group history)
└── Set loading state to false
```

### 2. Main Application Flow

#### 2.1 Home Screen (No Group Selected)
```
App loads → Show HomeScreen
├── Display user's groups list
├── Show "Create Group" button
├── Show "Join Group" (invite system)
└── Allow group selection
```

#### 2.2 Group Selection
```
User selects group → Set selectedGroupId
├── Filter transactions for selected group
├── Filter group members
├── Calculate balances
└── Show GroupView component
```

### 3. Group Management

#### 3.1 Creating a Group
```
User clicks "Create Group" → GroupFormModal opens
├── Enter group name
├── Select currency
├── Choose group type (trip, household, etc.)
├── Set trip dates (optional)
├── Add initial members
│   ├── Search existing people
│   ├── Add new people
│   └── Send email invites (optional)
└── Save group → Add to groups list
```

#### 3.2 Adding Members to Existing Group
```
User clicks "Add Members" → MemberInviteModal opens
├── Search existing people
├── Add new people
├── Send email invites
└── Update group membership
```

#### 3.3 Group Settings
```
User clicks settings → SettingsModal opens
├── Edit group details
├── Archive group
├── Manage members
└── Export data
```

### 4. Expense Management

#### 4.1 Adding an Expense
```
User clicks "Add Expense" → TransactionFormModal opens
├── Enter expense description
├── Enter amount
├── Select category (AI-powered suggestions)
├── Choose who paid
├── Select payment source
├── Split expense among members
│   ├── Equal split (default)
│   ├── Custom amounts
│   └── Percentage split
└── Save transaction
```

#### 4.2 AI-Powered Categorization
```
User enters description → Gemini AI analysis
├── Send description to Gemini API
├── Receive category suggestions
├── Display suggestions to user
└── Allow manual override
```

#### 4.3 Viewing Transactions
```
Transaction list displays
├── Show all transactions for selected group
├── Display payer, amount, description
├── Show user's share and balance
├── Provide edit/delete actions
└── Allow filtering and searching
```

### 5. Balance Management

#### 5.1 Balance Calculation
```
For each transaction:
├── Add full amount to payer's balance
├── Subtract each person's share from their balance
└── Calculate net balance per person
```

#### 5.2 Settlement Process
```
User clicks "Settle Up" → SettleUpModal opens
├── Show who owes whom
├── Allow user to settle specific amounts
├── Create settlement transaction
│   ├── Set payer (person giving money)
│   ├── Set receiver (person receiving money)
│   ├── Set amount
│   └── Update balances
└── Send settlement notification email
```

### 6. Payment Sources

#### 6.1 Managing Payment Sources
```
User accesses payment sources
├── View existing payment sources
├── Add new payment sources
├── Edit existing sources
└── Delete unused sources
```

### 7. Invite System

#### 7.1 Sending Invites
```
User adds member with email → Email invite sent
├── Generate unique invite token
├── Store invite in database
├── Send email via MailerSend
└── Track invite status
```

#### 7.2 Accepting Invites
```
User clicks invite link → ValidateInviteModal opens
├── Validate invite token
├── Show group details
├── Allow user to accept/decline
├── Add user to group
└── Send confirmation email
```

### 8. Data Synchronization

#### 8.1 Real-time Updates
```
User actions trigger updates
├── Add expense → Refresh transactions
├── Add member → Refresh people list
├── Settle up → Refresh balances
└── Custom events for cross-component updates
```

#### 8.2 Event-Driven Architecture
```
Custom events used for:
├── groupMemberAdded → Refresh people and groups
├── transactionAdded → Refresh transactions
├── balanceUpdated → Refresh balances
└── inviteAccepted → Refresh group members
```

## Security & Data Isolation

### 1. User Data Isolation
```
Each user only sees:
├── Groups they're members of
├── Transactions in their groups
├── Payment sources they created
└── People they've interacted with
```

### 2. Row-Level Security (RLS)
```
Supabase RLS policies ensure:
├── Users can only access their own data
├── Group members can only see group data
├── Payment sources are user-specific
└── Invites are properly secured
```

## Error Handling & Edge Cases

### 1. Duplicate User Prevention
```
ensureUserExists() handles:
├── Multiple users with same name
├── Case sensitivity issues
├── Automatic merging of duplicates
└── Data integrity preservation
```

### 2. Transaction Correction
```
Automatic fixes for:
├── Incorrect paid_by_id references
├── Orphaned transactions
├── Balance inconsistencies
└── User ID mismatches
```

## Performance Optimizations

### 1. Data Loading
```
Optimized queries:
├── Filter data by user membership
├── Use proper indexes
├── Implement pagination for large datasets
└── Cache frequently accessed data
```

### 2. UI Optimizations
```
React optimizations:
├── Memoized calculations
├── Efficient re-renders
├── Lazy loading of components
└── Optimized state management
```

## Integration Points

### 1. Clerk Authentication
```
Integration features:
├── User sign-in/sign-up
├── User profile management
├── Session management
└── User data synchronization
```

### 2. Supabase Backend
```
Backend services:
├── Database operations
├── Real-time subscriptions
├── File storage
└── Edge functions (future)
```

### 3. MailerSend Email Service
```
Email notifications:
├── Welcome emails
├── Group invites
├── Settlement notifications
└── System alerts
```

### 4. Google Gemini AI
```
AI features:
├── Expense categorization
├── Smart suggestions
├── Natural language processing
└── Context-aware recommendations
```

## Mobile & PWA Features

### 1. Progressive Web App
```
PWA capabilities:
├── Offline functionality
├── App installation
├── Push notifications
└── Responsive design
```

### 2. Mobile Optimization
```
Mobile features:
├── Touch-friendly interface
├── Responsive layouts
├── Mobile-specific gestures
└── Optimized performance
```

## Testing & Quality Assurance

### 1. Data Integrity
```
Validation checks:
├── Balance calculations
├── Transaction consistency
├── User data accuracy
└── Invite system reliability
```

### 2. User Experience
```
UX considerations:
├── Intuitive navigation
├── Clear balance displays
├── Efficient expense entry
└── Responsive feedback
```

## Deployment & Monitoring

### 1. Production Deployment
```
Deployment pipeline:
├── Vercel hosting
├── Environment variables
├── Database migrations
└── Performance monitoring
```

### 2. Error Monitoring
```
Monitoring includes:
├── User error tracking
├── Performance metrics
├── Database query optimization
└── API response times
```

## Future Enhancements

### 1. Planned Features
```
Upcoming improvements:
├── Receipt photo upload
├── Advanced reporting
├── Multi-currency support
├── Recurring expenses
└── Advanced analytics
```

### 2. Technical Improvements
```
Technical roadmap:
├── Edge functions for email
├── Real-time collaboration
├── Advanced caching
├── Mobile app development
└── API rate limiting
```

---

## Key Success Metrics

1. **User Engagement**: Active users, session duration
2. **Data Accuracy**: Balance calculations, transaction integrity
3. **Performance**: Page load times, API response times
4. **User Satisfaction**: Feature usage, error rates
5. **System Reliability**: Uptime, data consistency

This comprehensive flow analysis provides a complete picture of the Kharch-Baant application architecture, user journey, and technical implementation for AI agent analysis and review.
