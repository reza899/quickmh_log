# QuickMH Log

A simple, private tool to track your mental health scores over time. This application helps you monitor various mental health assessments including PHQ-9, GAD-7, and other standardized instruments.

## Features

- 🔒 **Privacy First**: All data is stored locally in your browser
- 📊 **Multiple Assessments**: Support for 7 validated mental health instruments
- 🌍 **Bilingual**: Full support for English and Persian/Farsi
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 📈 **Data Visualization**: Track your progress over time
- 💾 **Import/Export**: Backup and restore your data via CSV
- ⚡ **Fast & Lightweight**: No external dependencies, works offline

## Supported Assessments

- **PHQ-9**: Depression screening and severity assessment
- **GAD-7**: Generalized anxiety disorder assessment
- **AAQ-II**: Psychological flexibility and experiential avoidance
- **OCI-R**: Obsessive-compulsive symptoms assessment
- **Rosenberg Self-Esteem Scale**: Global self-worth measurement
- **Maslach Burnout Inventory**: Workplace burnout assessment
- **Pure Procrastination Scale**: Trait procrastination measurement

## Getting Started

### Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/quickmh-log.git
   cd quickmh-log
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `public/` directory.

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format

# Run all validations
npm run validate
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
quickmh-log/
├── src/
│   ├── css/
│   │   └── styles.css          # Application styles
│   ├── js/
│   │   ├── app.js              # Main application logic
│   │   └── translations.js     # Localization data
│   ├── tests/
│   │   ├── app.test.js         # Test files
│   │   └── setup.js            # Test configuration
│   └── index.html              # Main HTML file
├── public/                     # Built files (generated)
├── package.json                # Project configuration
├── vite.config.js              # Build configuration
├── vitest.config.js            # Test configuration
├── .eslintrc.js                # Linting rules
├── .prettierrc                 # Code formatting rules
└── README.md                   # This file
```

## Browser Support

- Modern browsers with ES2018+ support
- Progressive Web App (PWA) capabilities
- Offline functionality through service worker

## Privacy & Security

- **No Data Collection**: Your data never leaves your device
- **Local Storage**: All information is stored in your browser
- **No Analytics**: No tracking or analytics code
- **Secure Headers**: Content Security Policy and security headers implemented
- **Input Sanitization**: All user inputs are properly sanitized

## Deployment

### Static Hosting

The application can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Upload the `public/` directory to your hosting service

### Supported Platforms

- GitHub Pages
- Netlify
- Vercel
- Surge
- Any static file server

### Environment Variables

No environment variables are required for basic functionality.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run validate`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application is for informational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

## Acknowledgments

- Mental health assessment tools are based on published, validated instruments
- Icons and design inspired by modern web design principles
- Localization support for Persian/Farsi speaking users

---

**Note**: If you're experiencing a mental health crisis, please contact your local emergency services or a mental health crisis hotline immediately.