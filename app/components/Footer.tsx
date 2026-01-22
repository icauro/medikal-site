"use client";

import { theme } from "@/lib/theme";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`backdrop-blur-sm border-t text-sm ${theme.components.footer.background} ${theme.components.footer.border} ${theme.components.footer.text}`}>
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">Medikal Portal</h3>
            <p className={`text-xs leading-relaxed ${theme.components.footer.linkText}`}>
              Healthcare directory connecting patients with medical professionals and facilities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>Home</a></li>
              <li><a href="/about" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>About</a></li>
              <li><a href="/blogs" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>Blogs</a></li>
            </ul>
          </div>

          {/* Directory Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Directory</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/healthcare-database" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>Healthcare Database</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t pt-8 ${theme.components.footer.border}`}>
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {currentYear} Medikal Portal. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs">
              <a href="#" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>Privacy Policy</a>
              <a href="#" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>Terms of Service</a>
              <a href="#" className={`transition-colors ${theme.components.footer.linkText} ${theme.components.footer.linkHover}`}>Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
