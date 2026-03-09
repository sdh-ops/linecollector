import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) => {
    const baseClass = styles.button;
    const variantClass = styles[`variant-${variant}`];
    const sizeClass = styles[`size-${size}`];
    const widthClass = fullWidth ? styles.fullWidth : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
