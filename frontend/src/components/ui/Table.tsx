import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 lg:px-6 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({ children, onClick, className = '' }) => {
  return (
    <tr
      className={`${onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-4 py-4 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
};
