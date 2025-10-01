# ROAEP-Turnout 🗳️

A real-time election monitoring application that displays live turnout data for the Romanian presidential elections. The application provides an intuitive interface for tracking vote counts with automatic updates every 20 seconds.

## 🎯 Features

- **Real-time Data**: Automatically fetches and displays live voting data every 20 seconds
- **Dual Data Sources**: Tracks votes from both Romania and Diaspora separately
- **Combined View**: Shows aggregated results from all sources
- **Dark Mode**: Toggle between light and dark themes, with system preference detection
- **Responsive Design**: Built with React for modern web standards
- **User-friendly Display**: Clean, readable interface for election data
- **Caching**: Server-side caching to optimize API calls and performance

## 🏗️ Architecture

The application consists of two main components:

### Frontend (React + TypeScript + Vite)
- Built with React 19 and TypeScript
- Uses Vite for fast development and building
- Responsive UI with modern CSS
- Real-time data visualization with Recharts

### Backend (Express + TypeScript)
- Express.js server that acts as a proxy to ROAEP APIs
- Web scraping capabilities using Puppeteer for data extraction
- CORS-enabled for cross-origin requests
- Intelligent caching system (30-second TTL)
- Serves data from multiple endpoints:
  - Romania voting data
  - Diaspora voting data
  - Combined aggregated results

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MBernevig/roaep-turnout.git
   cd roaep-turnout
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure the API URLs (optional)**
   ```bash
   # Copy the example environment file
   cd server
   cp .env.example .env
   # Edit .env file to customize API URLs if needed
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm install  # Install server dependencies if not done already
   npm start    # or npm run dev
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   # In the root directory
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

## 📁 Project Structure

```
roaep-turnout/
├── public/                 # Static assets
├── src/                    # Frontend source code
│   ├── App.tsx            # Main React component
│   ├── main.tsx           # React entry point
│   ├── App.css            # Styling
│   └── assets/            # Images and icons
├── server/                # Backend source code
│   ├── index.ts           # Express server
│   ├── config.json        # Server configuration file
│   ├── .env               # Environment variables (create from .env.example)
│   ├── .env.example       # Environment variables template
│   └── package.json       # Server dependencies
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🛠️ Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**
- `npm start` - Start the Express server (production)
- `npm run dev` - Start the Express server (development)

### API Endpoints

The backend provides the following endpoints:

- `GET /api/votes` - Returns combined voting data
  - `romania`: Vote counts from Romania
  - `diaspora`: Vote counts from Diaspora
  - `combined`: Aggregated results

## 🔧 Configuration

The application can be configured through environment variables or configuration files.

### Environment Variables

Create a `.env` file in the `server/` directory to customize the API endpoints:

```bash
# ROAEP API Configuration
ROMANIA_API_URL=https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated.json
DIASPORA_API_URL=https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated_sr.json

# Server configuration
PORT=3001

# Cache configuration (in milliseconds)
CACHE_TTL=30000
```

### Configuration File

Alternatively, you can modify the `server/config.json` file:

```json
{
  "apiUrls": {
    "romania": "https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated.json",
    "diaspora": "https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated_sr.json"
  },
  "server": {
    "port": 3001,
    "cacheTtl": 30000
  }
}
```

**Configuration Priority:** Environment variables > config.json > default values

### Vite Proxy Configuration
The frontend is configured to proxy API requests to the backend server through Vite's development server.

### Caching
The backend implements a configurable cache (default: 30 seconds) to reduce load on the ROAEP servers while maintaining near real-time updates.

## 📊 Data Sources

The application fetches data from the official Romanian Electoral Authority (ROAEP) APIs:
- Romania data: `https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated.json`
- Diaspora data: `https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated_sr.json`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🏛️ About ROAEP

ROAEP (Autoritatea Electorală Permanentă) is the Romanian Electoral Authority responsible for organizing and monitoring elections in Romania. This application uses their publicly available APIs to display election turnout data.

---

**Note**: This application is for educational and informational purposes. Always refer to official ROAEP sources for authoritative election results.
