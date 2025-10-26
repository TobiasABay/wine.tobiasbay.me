// useToggle.ts - The right abstraction
import { useState, useCallback } from 'react';

interface ToggleActions {
    value: boolean;
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
}

const useToggle = (initial = false): ToggleActions => {
    const [value, setValue] = useState(initial);

    // Only memoize when passed to memoized children
    const toggle = useCallback(() => {
        setValue(v => !v);
    }, []);

    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return { value, toggle, setTrue, setFalse };
};

export default useToggle;

// USAGE: Clean, reusable, no unnecessary memo
// const Modal = () => {
//     const modal = useToggle();
//     const sidebar = useToggle(true);
//     return (
//         <>
//             <button onClick={modal.setTrue}>Open</button>
//             <button onClick={sidebar.toggle}>Toggle</button>
//             {modal.value && (
//                 <div className="modal">
//                     <button onClick={modal.setFalse}>
//                         Close
//                     </button>
//                 </div>
//             )}
//         </>
//     );
// };
// Result: Fast, clean, maintainable
// No React.memo wrapper needed
// only optimize when profiler shows issues