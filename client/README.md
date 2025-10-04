# Fixify Client

React frontend for Fixify - a local service marketplace built with Vite, React, and Tailwind CSS.

## 🚀 Features

- **Modern React**: Built with React 18 and Vite for fast development
- **Authentication**: Integrated with Clerk.dev for secure user authentication
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode**: Built-in dark/light theme switching
- **Type Safety**: Full TypeScript support (optional)
- **State Management**: React Query for server state management
- **UI Components**: Custom component library with Lucide React icons
- **Form Handling**: React Hook Form for efficient form management
- **Routing**: React Router for client-side routing
- **Maps Integration**: Ready for Google Maps or Mapbox integration
- **Image Upload**: Cloudinary integration for image handling

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Clerk.dev
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Maps**: React Map GL (Mapbox) / Google Maps
- **Date Handling**: Date-fns
- **HTTP Client**: Axios
- **Animations**: Framer Motion

## 📁 Project Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout/        # Layout components
│   │   ├── Providers/     # Context providers
│   │   └── UI/           # Basic UI components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── .env.example          # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see server README)

### Installation

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Colors

- **Primary**: Blue shades for main actions and branding
- **Secondary**: Gray shades for text and backgrounds
- **Success**: Green for positive actions
- **Warning**: Yellow/Orange for warnings
- **Error**: Red for errors and destructive actions

### Components

- **Buttons**: Primary, secondary, outline, and ghost variants
- **Cards**: Consistent card layouts with headers, content, and footers
- **Forms**: Input fields, selects, and form validation
- **Badges**: Status indicators and labels
- **Loading**: Spinners and skeleton loaders

### Dark Mode

The app supports automatic dark mode detection and manual theme switching. Theme preference is saved in localStorage.

## 🔐 Authentication

Authentication is handled by Clerk.dev with the following features:

- **Sign In/Sign Up**: Email, password, and social login
- **User Management**: Profile management and settings
- **Session Management**: Automatic session handling
- **Protected Routes**: Route protection based on authentication status

## 📱 Responsive Design

The app is built with a mobile-first approach:

- **Mobile**: Optimized for phones and tablets
- **Desktop**: Enhanced layouts for larger screens
- **Touch Friendly**: Large touch targets and gestures
- **Accessible**: WCAG compliant components

## 🗺️ Maps Integration

Ready for map integration with:

- **Google Maps**: For geolocation and job display
- **Mapbox**: Alternative mapping solution
- **Geocoding**: Address to coordinates conversion
- **Location Services**: Browser geolocation API

## 📊 State Management

- **Server State**: React Query for API data
- **Client State**: React hooks and context
- **Form State**: React Hook Form
- **Cache Management**: Automatic caching and invalidation

## 🚀 Performance

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Optimized image loading
- **Bundle Analysis**: Built-in bundle analyzer
- **Caching**: Strategic caching for better performance

## 🔧 Development

### Adding New Components

1. Create component in appropriate directory
2. Follow naming conventions
3. Add TypeScript types (if using TS)
4. Include proper accessibility attributes
5. Add to storybook (if configured)

### API Integration

1. Add endpoint to `src/utils/config.js`
2. Create service method in `src/services/api.js`
3. Use React Query for data fetching
4. Handle loading and error states

### Styling

1. Use Tailwind CSS classes
2. Follow design system guidelines
3. Support dark mode variants
4. Ensure responsive design
5. Maintain accessibility

## 🧪 Testing

- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end testing with Playwright
- **Accessibility**: Automated accessibility testing

## 📦 Build & Deploy

### Production Build

```bash
npm run build
```

### Environment Variables

Required for production:

- `VITE_API_URL`: Backend API URL
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key

### Deployment

The app can be deployed to:

- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for open source

## 🤝 Contributing

1. Follow the existing code style
2. Add proper TypeScript types
3. Include tests for new features
4. Update documentation
5. Ensure accessibility compliance

## 📄 License

This project is licensed under the ISC License.
