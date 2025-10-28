// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- Icon Components ---
const ArrowLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>);
const CheckCircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const XCircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> );
const BeakerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.443 2.216a2 2 0 001.284 1.572l1.086.543a2 2 0 002.19.006l1.086-.543a2 2 0 001.284-1.572l.443-2.216a2 2 0 00-.547-1.806zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> );

// --- Background Component ---
const Background = () => (
    <>
        <div className="absolute inset-0 -z-10 h-full w-full bg-gray-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 top-0 -z-10 h-1/3 w-full bg-gradient-to-b from-blue-900/30 to-transparent"></div>
    </>
);

// --- New Enhanced Nokia Snake Animation ---
const NokiaSnakeAnimation = () => {
    const [snake, setSnake] = useState([{ x: 0, y: 0 }]);
    const containerRef = useRef(null);
    const segmentSize = 12; // Controls segment size and speed
    const animationSpeed = 100; // Faster speed

    useEffect(() => {
        const animateSnake = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.offsetWidth;
            
            setSnake(prevSnake => {
                const newHead = { ...prevSnake[0] };
                newHead.x += segmentSize;

                if (newHead.x > containerWidth + segmentSize * 8) {
                    return [{ x: -segmentSize * 8, y: 0 }];
                }

                const newSnake = [newHead, ...prevSnake];
                if (newSnake.length > 8) { // Length of the snake
                    newSnake.pop();
                }
                return newSnake;
            });
        };

        const intervalId = setInterval(animateSnake, animationSpeed);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full max-w-4xl mx-auto h-4 overflow-hidden mt-12">
            {snake.map((segment, index) => (
                <div
                    key={index}
                    className="absolute h-3 w-3 bg-yellow-400 rounded-sm shadow-lg shadow-yellow-400/50"
                    style={{
                        left: `${segment.x}px`,
                        top: '2px',
                        opacity: 1 - (index / snake.length) * 0.7, // Tail fades
                    }}
                />
            ))}
        </div>
    );
};


// --- Landing Page Component ---
const LandingPage = ({ onGetStarted }) => (
    <div className="container mx-auto max-w-5xl p-4 sm:p-8 flex flex-col min-h-screen justify-center text-center animate-text-fade-in">
        <header className="relative mb-12"><div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_rgba(23,37,84,0.0)_70%)] -z-10"></div><h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-200 leading-tight">Welcome to Med-Verify</h1><p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">Your Trusted Medical News Detection Platform</p></header>
        <section className="mb-12"><p className="text-lg text-gray-300 max-w-3xl mx-auto">Med-Verify leverages advanced AI technologies to identify misinformation in medical news, ensuring you stay informed with trustworthy health information.</p>
            <button onClick={onGetStarted} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105">Get Started</button>
        </section>
        <section className="grid md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
            <div className="bg-gray-800/50 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:border-blue-400/50 hover:scale-105"><div className="flex items-center mb-2"><span className="text-2xl font-bold text-blue-400 mr-4">1</span><h3 className="font-semibold">Input News Snippet</h3></div><p className="text-gray-400 text-sm">Paste any medical text or article URL for analysis.</p></div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:border-blue-400/50 hover:scale-105"><div className="flex items-center mb-2"><span className="text-2xl font-bold text-blue-400 mr-4">2</span><h3 className="font-semibold">AI-Powered Analysis</h3></div><p className="text-gray-400 text-sm">Our engine cross-references trusted medical sources in real-time.</p></div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-white/10 transition-all duration-300 hover:border-blue-400/50 hover:scale-105"><div className="flex items-center mb-2"><span className="text-2xl font-bold text-blue-400 mr-4">3</span><h3 className="font-semibold">Instant Detection Results</h3></div><p className="text-gray-400 text-sm">Receive a clear credibility score and evidence-based verdict.</p></div>
        </section>
        <NokiaSnakeAnimation />
    </div>
);

// --- Tabbed LoginPage ---
const LoginPage = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState('signup');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const handleSignupSubmit = (e) => { e.preventDefault(); const username = signupUsername || signupEmail.split('@')[0] || 'New User'; onLogin({ username, email: signupEmail }); };
    const handleLoginSubmit = (e) => { e.preventDefault(); const username = loginEmail.split('@')[0] || 'Returning User'; onLogin({ username, email: loginEmail }); };
    const tabStyles = "w-full py-4 text-center font-semibold text-lg transition-colors duration-300 cursor-pointer";
    const activeTabStyles = "text-white bg-blue-600";
    const inactiveTabStyles = "text-gray-400 bg-gray-800 hover:bg-gray-700";
    return ( <div className="container mx-auto p-4 sm:p-8 flex flex-col min-h-screen justify-center animate-text-fade-in"><div className="max-w-md mx-auto w-full bg-gray-800/50 rounded-xl shadow-2xl border border-blue-400/20 overflow-hidden"><div className="flex"><div onClick={() => setActiveTab('signup')} className={`${tabStyles} ${activeTab === 'signup' ? activeTabStyles : inactiveTabStyles} rounded-tl-xl`}>Sign Up</div><div onClick={() => setActiveTab('login')} className={`${tabStyles} ${activeTab === 'login' ? activeTabStyles : inactiveTabStyles} rounded-tr-xl`}>Login</div></div><div className="p-8"><div className={`transition-opacity duration-500 ${activeTab === 'signup' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}><h2 className="text-3xl font-bold text-white mb-6">Create Account</h2><form onSubmit={handleSignupSubmit}><div className="mb-4"><label className="block text-gray-400 mb-2 text-sm" htmlFor="signup-username">Username</label><input value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} type="text" id="signup-username" className="w-full p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div><div className="mb-4"><label className="block text-gray-400 mb-2 text-sm" htmlFor="signup-email">Email Address</label><input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} type="email" id="signup-email" required className="w-full p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div><div className="mb-6"><label className="block text-gray-400 mb-2 text-sm" htmlFor="signup-password">Password</label><input type="password" id="signup-password" className="w-full p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300">Sign Up</button></form><p className="text-sm text-gray-400 mt-6 text-center">Join Med-Verify and start verifying medical news with AI-powered technology.</p></div><div className={`transition-opacity duration-500 ${activeTab === 'login' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}><h2 className="text-3xl font-bold text-white mb-6">Sign In</h2><form onSubmit={handleLoginSubmit}><div className="mb-4"><label className="block text-gray-400 mb-2 text-sm" htmlFor="login-email">Email or Username</label><input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" id="login-email" required className="w-full p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div><div className="mb-6"><label className="block text-gray-400 mb-2 text-sm" htmlFor="login-password">Password</label><input type="password" id="login-password" className="w-full p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300">Login</button><p className="text-sm text-gray-500 mt-4 text-center">Forgot your password?</p></form><p className="text-sm text-gray-400 mt-6 text-center">Access your Med-Verify account to detect fake medical news instantly.</p></div></div></div></div> );
};

// --- Main App Components ---
const CircularProgress = ({ status, isFinishing }) => { const stages = ['Extracting keywords','Checking sources','Compiling results','Final verdict']; const radius = 80; const circumference = 2 * Math.PI * radius; return (<div className="relative w-64 h-64 flex flex-col items-center justify-center"><svg width="256" height="256" viewBox="0 0 256 256" className={`absolute inset-0 animate-spin transition-opacity duration-500 ${isFinishing ? 'opacity-0' : 'opacity-100'}`} style={{ animationDuration: '4.5s', animationTimingFunction: 'linear' }}><circle cx="128" cy="128" r={radius} fill="none" stroke="url(#revolveGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${circumference / 4} ${circumference}`} /><defs><linearGradient id="revolveGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs></svg><div className={`w-full h-full rounded-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_rgba(191,219,254,0.15)_0%,_rgba(59,130,246,0.1)_40%,_rgba(23,37,84,0.1)_100%)] ${status === 3 ? 'animate-celebrate-glow' : ''}`}><div className="absolute inset-0 rounded-full shadow-[inset_0px_0px_30px_rgba(0,0,0,0.5)]"></div><div className="relative h-20 w-40 text-center flex items-center justify-center">{stages.map((stage, index) => (status === index && (<p key={stage} className="absolute text-center text-white animate-text-fade-in font-semibold text-lg">{stage}</p>)))}</div></div></div>); };
const ReportCard = ({ data }) => { const getScoreStyles = (score) => { if (score < 30) return { color: '#ef4444', ring: 'ring-red-500', bg: 'bg-red-900/50', glow: 'shadow-[0_0_20px_theme(colors.red.500/0.3)]' }; if (score < 70) return { color: '#f59e0b', ring: 'ring-amber-500', bg: 'bg-amber-900/50', glow: 'shadow-[0_0_20px_theme(colors.amber.500/0.3)]' }; return { color: '#22c55e', ring: 'ring-green-500', bg: 'bg-green-900/50', glow: 'shadow-[0_0_20px_theme(colors.green.500/0.3)]' }; }; const styles = getScoreStyles(data.credibility_score); const getVerdictText = (judgment) => { const verdicts = {'Contradicted': 'Highly Unreliable', 'Supported': 'Likely Reliable', 'Unsupported/Neutral': 'Uncertain / Neutral'}; return verdicts[judgment] || 'Analysis Inconclusive'; }; return (<div className={`mt-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-400/20 ring-1 ring-inset ring-white/10 animate-text-fade-in ${styles.glow} transition-shadow duration-500`}><div className="flex justify-between items-start"><h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-200 mb-6">Analysis Report</h2></div><div className="grid md:grid-cols-2 gap-6 items-center"><div className="flex flex-col items-center justify-center p-4"><div className={`relative w-40 h-40 flex items-center justify-center rounded-full ${styles.bg}`}><div className={`absolute inset-0 rounded-full ring-4 ${styles.ring} ring-opacity-50`}></div><div className={`absolute inset-0 rounded-full ring-2 ${styles.ring}`}></div><span className="text-5xl font-bold" style={{ color: styles.color }}>{data.credibility_score}<span className="text-3xl text-gray-400">/100</span></span></div><p className="mt-4 text-xl font-semibold" style={{ color: styles.color }}>{getVerdictText(data.llm_judgment)}</p></div><div className="space-y-4 text-gray-300 text-sm"><div><h3 className="font-semibold text-white/80 flex items-center"><XCircleIcon/>Verdict</h3><p className="ml-7 pl-1 border-l border-gray-600">{data.llm_judgment}</p></div><div><h3 className="font-semibold text-white/80 flex items-center"><CheckCircleIcon/>Evidence Summary</h3><p className="ml-7 pl-1 border-l border-gray-600">{data.reasoning}</p></div><div><h3 className="font-semibold text-white/80 flex items-center"><BeakerIcon/>Key Terms Extracted</h3><div className="ml-7 pl-1 border-l border-gray-600 flex flex-wrap gap-2 mt-1">{data.extracted_terms.map(term => (<span key={term} className="font-mono bg-gray-700/50 text-blue-300 px-2 py-1 rounded-md text-xs">{term}</span>))}</div></div><div><h3 className="font-semibold text-white/80">Source Analyzed</h3><p className="text-blue-400 break-all text-xs ml-7 pl-1 border-l border-gray-600">{data.source_origin}</p></div></div></div><p className="mt-6 text-xs text-center text-amber-400 bg-amber-900/50 p-2 rounded-lg border border-amber-500/30"><strong>Disclaimer:</strong> This is an AI-powered analysis and not a substitute for professional medical advice.</p></div>); };

// --- PLACEHOLDER PAGE COMPONENTS ---
const PreviousHistoryPage = () => <div className="text-center"><h1 className="text-4xl font-bold">Previous History</h1><p className="mt-4 text-gray-400">Your past verification history will be displayed here.</p></div>;
const SubmitClaimPage = () => { const [submitted, setSubmitted] = useState(false); const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); }; if (submitted) { return ( <div className="text-center animate-text-fade-in"><CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" /><h1 className="text-4xl font-bold">Thank You!</h1><p className="mt-4 text-gray-400">Your claim has been submitted for review by our team.</p></div> ); } return ( <div className="w-full max-w-2xl mx-auto"><h1 className="text-4xl font-bold text-center mb-8">Submit a Claim for Review</h1><form onSubmit={handleSubmit} className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-blue-400/20 space-y-6"><div>
                    <label className="block text-gray-300 mb-2 font-semibold" htmlFor="claim-text">News Claim</label>
                    <textarea id="claim-text" placeholder="e.g., 'Sugarcane is good for health.'" required className="w-full h-32 p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition duration-300 placeholder:text-gray-500"/>
                </div>

                 <div>
                    <label className="block text-gray-300 mb-2 font-semibold" htmlFor="claim-reasoning">Your Reasoning</label>
                    <textarea id="claim-reasoning" placeholder="Why do you think this claim is true or false?" className="w-full h-24 p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition duration-300 placeholder:text-gray-500"/>
                </div>
                <div>
                    <label className="block text-gray-300 mb-2 font-semibold">Your Verdict</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="verdict" className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-600"/> Correct</label>
                        <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="verdict" className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-600"/> Incorrect</label>
                    </div>
                </div>
                <div>
                    <label className="block text-gray-300 mb-2 font-semibold" htmlFor="claim-sources">Sources (Links, etc.)</label>
                    <textarea id="claim-sources" placeholder="e.g., https://www.timesofindia.com/..." className="w-full h-24 p-4 text-base bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition duration-300 placeholder:text-gray-500"/>
                </div>
                <div>
                     <label className="block text-gray-300 mb-2 font-semibold" htmlFor="claim-image">Upload Image (Optional)</label>
                     <input type="file" id="claim-image" className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-300 hover:file:bg-blue-500/20"/>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300">Submit for Review</button>
            </form>
        </div>
    );
};
const ProfilePage = ({ user, onLogout }) => ( <div className="text-center max-w-md mx-auto"><h1 className="text-4xl font-bold mb-8">Profile</h1><div className="bg-gray-800/50 p-8 rounded-xl border border-white/10 text-left space-y-6"><div><p className="text-base text-gray-400 mb-1">Username</p><p className="text-3xl font-semibold text-white">{user ? user.username : 'Loading...'}</p></div><div><p className="text-base text-gray-400 mb-1">Email</p><p className="text-xl text-blue-300 break-all">{user ? user.email : 'Loading...'}</p></div></div><button onClick={onLogout} className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300">Logout</button></div> );

// --- DETECTOR TOOL (Dashboard) ---
const DetectorPage = () => {
    const [input, setInput] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState(''); const [analysisStatus, setAnalysisStatus] = useState(-1); const [isFinishing, setIsFinishing] = useState(false); const exampleQueries = [ "Does drinking lemon water cure cancer?", "The MMR vaccine causes autism.", "https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)" ]; const handleExampleClick = (query) => { setInput(query); handleSubmit(null, query); }; const handleSubmit = async (e, query = input) => { if (e) e.preventDefault(); if (!query) { setError('Please enter a URL or text to verify.'); return; } setLoading(true); setResult(null); setError(''); setAnalysisStatus(0); setIsFinishing(false); const stageDuration = 1500; setTimeout(() => setAnalysisStatus(1), stageDuration); setTimeout(() => setAnalysisStatus(2), stageDuration * 2); try { const response = await axios.post('http://127.0.0.1:5000/medverify/check', { input: query }); setAnalysisStatus(3); setIsFinishing(true); setTimeout(() => { setResult(response.data); setLoading(false); }, 1600); } catch (err) { console.error("API Error:", err); setError('Failed to connect to the backend. Is the server running?'); setLoading(false); setAnalysisStatus(-1); } };
    return (
        <>
            <div className={`transition-all duration-500 ${loading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
                <div className="container mx-auto max-w-4xl p-4 sm:p-8 flex flex-col items-center">
                    <header className="text-center mb-10"><h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">Med-Verify</h1><p className="text-gray-400 mt-2 text-lg">Your AI-Powered Medical Misinformation Detector</p></header>
                    <main className="w-full">
                        <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-blue-400/20 ring-1 ring-inset ring-white/10">
                            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter an article URL or paste a medical claim..." className="w-full h-48 p-5 text-lg bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition duration-300 placeholder:text-gray-500"/>
                            <button type="submit" disabled={loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white font-bold py-5 text-xl rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-100">{loading ? 'Analyzing...' : 'Verify Claim'}</button>
                        </form>
                        <div className="text-center text-gray-500 mt-6"><p>Or try an example:</p><div className="flex flex-wrap justify-center gap-3 mt-3">{exampleQueries.map(q => (<button key={q} onClick={() => handleExampleClick(q)} className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-base px-5 py-2 rounded-full transition">"{q.substring(0, 30)}..."</button>))}</div></div>
                        {error && <p className="text-red-400 mt-4 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}{result && <ReportCard data={result} />}
                    </main>
                </div>
            </div>
            <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{loading && <CircularProgress status={analysisStatus} isFinishing={isFinishing} />}</div>
        </>
    );
};

// --- App Layout with Navigation ---
const AppLayout = ({ activePage, setPage, user, onLogout }) => {
    const navButtonStyles = "px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300";
    const activeNavStyles = "bg-blue-600 text-white";
    const inactiveNavStyles = "bg-transparent hover:bg-gray-800/50 text-gray-300";
    const renderActivePage = () => {
        switch (activePage) {
            case 'history': return <PreviousHistoryPage />;
            case 'submit': return <SubmitClaimPage />;
            case 'profile': return <ProfilePage user={user} onLogout={onLogout} />;
            case 'dashboard': default: return <DetectorPage />;
        }
    };
    return (
        <div className="w-full min-h-screen flex flex-col items-center animate-text-fade-in p-8">
            <nav className="w-full max-w-7xl flex items-center justify-between mb-10">
                <button onClick={() => setPage(activePage === 'dashboard' ? 'landing' : 'dashboard')} className={`${inactiveNavStyles} ${navButtonStyles} flex items-center gap-2`}>
                    <ArrowLeftIcon /> Back
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage('dashboard')} className={`${navButtonStyles} ${activePage === 'dashboard' ? activeNavStyles : inactiveNavStyles}`}>Dashboard</button>
                    <button onClick={() => setPage('history')} className={`${navButtonStyles} ${activePage === 'history' ? activeNavStyles : inactiveNavStyles}`}>Previous History</button>
                    <button onClick={() => setPage('submit')} className={`${navButtonStyles} ${activePage === 'submit' ? activeNavStyles : inactiveNavStyles}`}>Submit Claim</button>
                    <button onClick={() => setPage('profile')} className={`${navButtonStyles} ${activePage === 'profile' ? activeNavStyles : inactiveNavStyles}`}>Profile</button>
                </div>
            </nav>
            <div className="flex-grow w-full flex items-center justify-center">
                {renderActivePage()}
            </div>
            <footer className="text-center text-gray-600 pt-12"><p></p></footer>
        </div>
    );
};


// --- App Router ---
function App() {
    const [page, setPage] = useState('landing');
    const [currentUser, setCurrentUser] = useState(null);
    const handleLogin = (userData) => { setCurrentUser(userData); setPage('dashboard'); };
    const handleLogout = () => { setCurrentUser(null); setPage('landing'); };
    const renderPage = () => {
        switch (page) {
            case 'login': return <LoginPage onLogin={handleLogin} />;
            case 'landing': return <LandingPage onGetStarted={() => setPage('login')} />;
            default: return <AppLayout activePage={page} setPage={setPage} user={currentUser} onLogout={handleLogout} />;
        }
    };
    return (<div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500/30 overflow-hidden"><Background />{renderPage()}</div>);
}

export default App;