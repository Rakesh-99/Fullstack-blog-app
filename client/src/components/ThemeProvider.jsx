import React from 'react'
import { useSelector } from 'react-redux';



const ThemeProvider = ({ children }) => {



    const { theme } = useSelector((state) => state.themeSliceApp);



    return (
        <div className={`${theme} ${theme === 'light' ? 'bg-blue-50 text-gray-700' : 'bg-gray-900 text-gray-100'}`}>
            {children}
        </div>
    )
}
export default ThemeProvider;