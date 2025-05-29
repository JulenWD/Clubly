import { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

export const Button = ({ children, ...props }: ButtonProps) => {
    return (
        <button
            {...props}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
            {children}
        </button>
    );
};
