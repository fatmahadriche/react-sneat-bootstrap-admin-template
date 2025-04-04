import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.css';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange 
}) => {
    return (
        <div className="pagination-container">
            <div className="items-per-page">
                <select 
                    className="form-select form-select-sm"
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(e.target.value)}
                >
                    <option value="10">10 par page</option>
                    <option value="20">20 par page</option>
                    <option value="50">50 par page</option>
                </select>
            </div>
            
            <div className="pagination-controls">
                <button
                    className="btn-pagination"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Précédent
                </button>
                
                <span className="page-info">
                    Page {currentPage} sur {totalPages}
                </span>
                
                <button
                    className="btn-pagination"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Suivant
                </button>
            </div>
        </div>
    );
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    itemsPerPage: PropTypes.number.isRequired,
    onItemsPerPageChange: PropTypes.func.isRequired
};

export default Pagination;