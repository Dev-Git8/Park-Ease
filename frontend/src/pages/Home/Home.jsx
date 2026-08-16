import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/api';
import Hero from '../../components/home/Hero';
import SearchBar from '../../components/home/SearchBar';
import TrustCarousel from '../../components/home/TrustCarousel';
import Services from '../../components/home/Services';
import Listings from '../../components/home/Listings';
import Facilities from '../../components/home/Facilities';
import Stats from '../../components/home/Stats';
import Testimonials from '../../components/home/Testimonials';
import { useSiteUI } from '../../context/SiteUIContext';

const Home = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { isReady } = useSiteUI();
    const { hash } = useLocation();

    const fetchBusinesses = async (search = '') => {
        setLoading(true);
        try {
            const endpoint = search ? `/business?search=${encodeURIComponent(search)}` : '/business';
            const { data } = await api.get(endpoint);
            setBusinesses(data.data);
        } catch (error) {
            console.error('Error fetching businesses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    useEffect(() => {
        if (!hash) return;
        const id = hash.slice(1);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, [hash]);

    const handleSearch = (event) => {
        if (event) event.preventDefault();
        fetchBusinesses(searchTerm);
        document.getElementById('listings')?.scrollIntoView?.({ behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col gap-3 pb-3">
            <Hero businesses={businesses} ready={isReady} />
            <SearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} onSearch={handleSearch} />
            <TrustCarousel />
            <Services />
            <Listings businesses={businesses} loading={loading} />
            <Facilities />
            <Stats />
            <Testimonials />
        </div>
    );
};

export default Home;
