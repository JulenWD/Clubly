import { ReactNode } from "react";

export const Card = ({ children }: { children: ReactNode }) => {
    return (
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
            {children}
        </div>
    );
};

export const CardContent = ({ children }: { children: ReactNode }) => {
    return <div className="mt-2">{children}</div>;
};
