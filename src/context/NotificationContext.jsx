import React, { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificationCount, setNotificationCount] = useState(0);

  return (
    <NotificationContext.Provider
      value={{ notificationCount, setNotificationCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount() {
  const ctx = useContext(NotificationContext);
  return ctx?.notificationCount ?? 0;
}

export function useSetNotificationCount() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Return a no-op function if context is missing
    return () => {};
  }
  return ctx.setNotificationCount;
}
