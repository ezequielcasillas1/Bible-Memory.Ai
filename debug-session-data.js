// DEBUG SCRIPT: Test session data structure for fill-in-blank UI
// Run this in browser console after navigating to Syntax Lab

console.log('🔍 SYNTAX LAB SESSION DEBUG SCRIPT');
console.log('=====================================');

// Wait for React to mount
setTimeout(() => {
    try {
        // Try to access React component state
        const syntaxLabElement = document.querySelector('[data-testid="syntax-lab"]') || document.querySelector('.min-h-screen');
        
        if (syntaxLabElement) {
            console.log('✅ Found SyntaxLab element');
            
            // Check for FillInBlankPractice component logs
            console.log('📊 Checking console for FillInBlankPractice logs...');
            console.log('Look for: "🔥 COMPONENT MOUNT TEST: FillInBlankPractice is loading!"');
            console.log('Look for: "🎯 FILL-IN-BLANK UI UPDATE:"');
            
            // Manual test instructions
            console.log('\n🧪 MANUAL TEST STEPS:');
            console.log('1. Go to Memorize page');
            console.log('2. Type a verse with some wrong words');
            console.log('3. Submit and get comparison results');
            console.log('4. Click "Go to Syntax Lab" button');
            console.log('5. Check if fill-in-blank shows enhanced UI (purple/yellow) or plain text');
            console.log('6. Look for these console logs to debug:');
            console.log('   - "🎯 UNIFIED SESSION CREATED:" (should show session data)');
            console.log('   - "🔥 COMPONENT MOUNT TEST: FillInBlankPractice is loading!" (component mounted)');
            console.log('   - "🎯 FILL-IN-BLANK UI UPDATE:" (UI rendering data)');
            
            // Check if localStorage has any relevant data
            const keys = Object.keys(localStorage).filter(k => k.includes('syntax') || k.includes('session') || k.includes('fill'));
            if (keys.length > 0) {
                console.log('\n💾 Found localStorage keys:', keys);
                keys.forEach(key => {
                    try {
                        const value = JSON.parse(localStorage.getItem(key));
                        console.log(`${key}:`, value);
                    } catch (e) {
                        console.log(`${key}:`, localStorage.getItem(key));
                    }
                });
            }
            
        } else {
            console.log('❌ SyntaxLab element not found');
        }
        
    } catch (error) {
        console.error('❌ Debug script error:', error);
    }
}, 1000);

// Helper function to check session structure
window.debugSyntaxLabSession = function() {
    console.log('🔍 Manual session debug - call this after reaching Syntax Lab');
    
    // Look for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools detected');
        console.log('💡 Use React DevTools to inspect SyntaxLabPage component state');
        console.log('   Look for: currentSession.wrongWords');
        console.log('   Look for: currentSession.fillInBlankResult');
    }
    
    // Check for any global variables or exposed state
    if (window.React) {
        console.log('✅ React is available globally');
    }
    
    return {
        instructions: [
            '1. Open React DevTools',
            '2. Find SyntaxLabPage component',
            '3. Check currentSession state',
            '4. Verify wrongWords array has entries',
            '5. Check if fillInBlankResult is populated'
        ]
    };
};

console.log('\n🎯 Call debugSyntaxLabSession() for manual debugging help');
