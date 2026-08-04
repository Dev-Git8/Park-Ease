export const HERO_CONTENT = {
    // Kept to 3 words: at the reference's 12.5vw whitespace-nowrap treatment, a
    // 4th word ("Perfect") ran the line past the viewport edge on common desktop widths.
    titleWords: ['Find', 'Your', 'Spot'],
    taglineLines: ['Park Smart,', 'Drive More'],
};

export const HERO_STAT = {
    value: '12K+',
    caption: 'Drivers parked today',
    dotColors: ['#5790e6', '#c2e029', '#0b6e97', '#ffffff'],
};

export const TRUST_SLIDES = [
    {
        headline: ['Secure', 'Simple', 'Instant', 'Booking'],
        name: 'Downtown Garage',
        role: 'Verified Location',
        imageKey: 'trustSlide1',
        alt: 'Multi-level parking garage interior with cars parked along a ramp',
    },
    {
        headline: ['Verified', 'Trusted', 'Local', 'Hosts'],
        name: 'EV Charging Hub',
        role: 'Verified Location',
        imageKey: 'trustSlide2',
        alt: 'Electric car plugged into a charging station',
    },
    {
        headline: ['Smarter', 'City', 'Parking', 'Today'],
        name: 'Rooftop Collective',
        role: 'Verified Location',
        imageKey: 'trustSlide3',
        alt: 'Sleek car parked on a rooftop with a city skyline behind it',
    },
];

export const TRUST_BADGE = {
    index: '#01',
    title: 'Trusted by drivers everywhere',
    body: "From quick errands to daily commutes, drivers book here because the spot is always exactly where the app says it'll be.",
    percent: '100%',
    percentCaption: 'Booking built around your trip',
};

export const SERVICES = [
    { index: '01', name: 'Hourly Parking', description: 'Drop in and pay only for the time you use.', href: '#hourly' },
    { index: '02', name: 'Monthly Passes', description: 'Reserved parking every day at a flat monthly rate.', href: '#monthly' },
    { index: '03', name: 'EV Charging Spots', description: 'Charge your vehicle while you park, hassle-free.', href: '#ev' },
    { index: '04', name: 'Valet & Event Parking', description: 'White-glove parking for events and busy venues.', href: '#valet' },
];

export const FACILITIES = [
    {
        tone: 'clay',
        name: 'Skyline Rooftop Lot',
        description: 'An open-air rooftop lot with skyline views and easy access.',
        imageKey: 'facilityRooftop',
        alt: 'Two sports cars parked on a rooftop parking garage',
    },
    {
        tone: 'blue',
        name: 'Harbor Parking Garage',
        description: 'A secure, climate-covered garage built for all-day parking.',
        imageKey: 'facilityGarage',
        alt: 'Modern multi-story parking garage interior with ventilation systems',
    },
];

export const STATS = [
    { value: '40+', label: 'Cities covered' },
    { value: '1,200+', label: 'Verified locations' },
    { value: '2.4M+', label: 'Successful bookings' },
    { value: '8', label: 'Years on the road' },
];

export const TESTIMONIALS = [
    { quote: 'I found a spot two minutes from the stadium during a sold-out game. Booked in seconds.', name: 'Maya Chen', role: 'Daily Commuter' },
    { quote: 'The monthly pass saved me over $200 and I never circle the block anymore.', name: 'Tomás Ibarra', role: 'Downtown Resident' },
    { quote: 'Listing my garage on ParkEase filled it every weekday within a week.', name: 'Renee Walsh', role: 'Lot Owner' },
];

export const NAV_LINKS = [
    { name: 'Find Parking', href: '#listings' },
    { name: 'Services', href: '#services' },
];

export const MENU_LINKS = [
    { name: 'Home', to: '/' },
    { name: 'Find Parking', to: '/#listings' },
    { name: 'Services', to: '/#services' },
    { name: 'About', to: '/about' },
];

export const FOOTER_LINKS = {
    services: [
        { name: 'Hourly Parking', href: '#hourly' },
        { name: 'Monthly Passes', href: '#monthly' },
        { name: 'EV Charging Spots', href: '#ev' },
        { name: 'Valet & Event Parking', href: '#valet' },
    ],
    company: [
        { name: 'About', to: '/about' },
        { name: 'List Your Lot', href: '#list-your-lot' },
        { name: 'Careers', href: '#careers' },
        { name: 'Contact', href: '#contact' },
    ],
    legal: [
        { name: 'Privacy', href: '#privacy' },
        { name: 'Terms', href: '#terms' },
        { name: 'Help Center', href: '#help' },
    ],
};

export const SOCIAL_LINKS = [
    { name: 'Instagram', href: '#instagram' },
    { name: 'X', href: '#x' },
    { name: 'YouTube', href: '#youtube' },
    { name: 'LinkedIn', href: '#linkedin' },
];

export const CONTACT_INFO = {
    email: 'hello@parkease.com',
    phone: '+1 (212) 555-0148',
    address: '500 Market Street, San Francisco',
};
