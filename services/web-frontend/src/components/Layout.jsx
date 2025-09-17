import React from "react";
import NavigationHeader from "./ui/NavigationHeader";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationHeader />
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      {/* Footer */}
      <footer className="bg-blue-900 text-white py-2 mt-8">
        <div className="container mx-auto px-4 text-center text-sm">
          &copy; {new Date().getFullYear()} Industrial Safety Monitor
        </div>
      </footer>
    </div>
  );
};

export default Layout;
