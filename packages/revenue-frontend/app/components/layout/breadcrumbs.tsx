/**
 * Breadcrumbs Component
 * Dynamic breadcrumb navigation based on current route
 */

import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

/**
 * Convert route segment to display name
 */
function formatSegment(segment: string): string {
  // Handle dynamic segments (IDs)
  if (
    segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  ) {
    return "Details";
  }

  // Capitalize first letter of each word
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ name: "Dashboard", href: "/", isLast: true }];
  }

  const breadcrumbs = [{ name: "Dashboard", href: "/", isLast: false }];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: formatSegment(segment),
      href: currentPath,
      isLast: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}

export function Breadcrumbs() {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.name}</span>
          ) : (
            <Link
              to={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
