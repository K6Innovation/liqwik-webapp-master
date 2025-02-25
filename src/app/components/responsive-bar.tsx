"use client";
import React, { use, useState } from 'react'
import AppBar from './app-bar'
import MobileBar from './mobile-bar'

const ResponsiveBar = () => {
    const [showNav, setShowNav] = useState(false);
    const openNavHandler = () => setShowNav(true);
    const closeNavHandler = () => setShowNav(false);
    
    return (
    <div>
    <AppBar openNav={openNavHandler}/>
    <MobileBar showNav={showNav} closeNav={closeNavHandler}/>
    </div>
    );
};

export default ResponsiveBar