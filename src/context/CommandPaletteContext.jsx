import React, { createContext, useState, useContext } from 'react';

const CommandPaletteContext = createContext();

export function CommandPaletteProvider({ children }) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <CommandPaletteContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
