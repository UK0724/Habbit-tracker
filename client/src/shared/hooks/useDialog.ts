import { useEffect } from "react";
/** Trap keyboard focus in the visible dialog, support Escape, restore the trigger. */
export const useDialog = (open: boolean, close: () => void, selector: string) => {
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLElement>(selector);
    if(!dialog)return;
    const focusable=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex="0"]'));
    focusable()[0]?.focus();
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();close();}if(event.key==="Tab"){const items=focusable();const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
    dialog.addEventListener("keydown",key);
    return ()=>{dialog.removeEventListener("keydown",key);previous?.focus();};
  },[open,close,selector]);
};
