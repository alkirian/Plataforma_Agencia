import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import toast from 'react-hot-toast';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('cadence-theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const handleThemeChange = (nextTheme, event) => {
    const changeThemeDOM = () => {
      setTheme(nextTheme);
      localStorage.setItem('cadence-theme', nextTheme);
      if (nextTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.add('dark');
      }
    };

    if (!document.startViewTransition || !event) {
      changeThemeDOM();
      toast.success(nextTheme === 'light' ? 'Modo Claro activado' : 'Modo Oscuro activado');
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        changeThemeDOM();
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });

    toast.success(nextTheme === 'light' ? 'Modo Claro activado' : 'Modo Oscuro activado');
  };

  const toggleTheme = (event) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    handleThemeChange(nextTheme, event);
  };

  return (
    <ThemeContext.Provider value={{ theme, handleThemeChange, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
