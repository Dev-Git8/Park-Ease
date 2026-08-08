import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SiteUIProvider, useSiteUI } from './context/SiteUIContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileMenu from './components/layout/MobileMenu';
import IntroLoader from './components/overlays/IntroLoader';
import ContactModal from './components/overlays/ContactModal';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './pages/Profile/Profile';
import BusinessDetails from './pages/Home/BusinessDetails';
import BookingSuccess from './pages/BookingSuccess/BookingSuccess';
import AdminDashboard from './pages/Admin/AdminDashboard';
import BusinessDashboard from './pages/Dashboard/BusinessDashboard';
import About from './pages/About/About';
import CheckoutSummary from './pages/CheckoutSummary';

const ROUTE_TRANSITION = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
};

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pulse"></div>
        </div>
    );

    if (!user) return <Navigate to="/login" />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppContent = () => {
    const { markReady, lenis } = useSiteUI();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        lenis?.scrollTo(0);
    }, [location.pathname, lenis]);

    return (
        <main className="w-full overflow-x-clip bg-white p-2 sm:p-3">
            <IntroLoader onReady={markReady} />
            <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1 flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={ROUTE_TRANSITION.initial}
                            animate={ROUTE_TRANSITION.animate}
                            exit={ROUTE_TRANSITION.exit}
                            transition={ROUTE_TRANSITION.transition}
                            className="flex flex-1 flex-col"
                        >
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/business/:id" element={<BusinessDetails />} />
                                <Route path="/booking-success" element={<BookingSuccess />} />
                                <Route path="/about" element={<About />} />

                                {/* Customer Routes */}
                                <Route path="/profile" element={
                                    <ProtectedRoute roles={['customer']}>
                                        <Profile />
                                    </ProtectedRoute>
                                } />
                                <Route path="/checkout-summary" element={
                                    <ProtectedRoute roles={['customer']}>
                                        <CheckoutSummary />
                                    </ProtectedRoute>
                                } />

                                {/* Business Owner Routes */}
                                <Route path="/dashboard" element={
                                    <ProtectedRoute roles={['business']}>
                                        <BusinessDashboard />
                                    </ProtectedRoute>
                                } />

                                {/* Admin Routes */}
                                <Route path="/admin" element={
                                    <ProtectedRoute roles={['admin']}>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </div>
                <Footer />
            </div>
            <MobileMenu />
            <ContactModal />
        </main>
    );
};

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <SiteUIProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </SiteUIProvider>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;
