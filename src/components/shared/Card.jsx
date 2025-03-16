import React from 'react';

const Card = ({ 
  children, 
  title,
  footer,
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`card bg-white dark:bg-[var(--color-surface)] rounded-lg shadow overflow-hidden ${className}`} 
      {...props}
    >
      {title && (
        <div className="card-header px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-medium leading-6 text-[var(--color-text-primary)]">
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className="card-body px-4 py-5 sm:p-6">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;