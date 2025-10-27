import React, { useState } from 'react';
import axios from 'axios';

const ReportCard = ({ data }) => {
    const getScoreColor = (score) => {
        if (score < 30) return 'text-red-500';
        if (score < 70) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getVerdictText = (judgment) => {
        switch (judgment) {
            case 'Contradicted': return 'Highly Unreliable';
            case 'Supported': return 'Likely Reliable';
            default: return 'Uncertain / Neutral';
        }
    };

    if (!data) return null;

    return (
        <div className="mt-8 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Med-Verify Report</h2>
            <div className="text-center mb-6">
                <p className={`text-7xl font-bold ${getScoreColor(data.credibility_score)}`}>
                    {data.credibility_score}<span className="text-3xl text-gray-400">/100</span>
                </p>
                <p className={`text-xl font-semibold ${getScoreColor(data.credibility_score)}`}>
                    {getVerdictText(data.llm_judgment)}
                </p>
            </div>
            <div className="space-y-3 text-gray-300">
                <p><strong>Verdict:</strong> {data.llm_judgment}</p>
                <p><strong>Evidence Summary:</strong> {data.reasoning}</p>
                <p><strong>Most Trusted Reference:</strong> {data.trusted_reference}</p>
                <p><strong>Source Analyzed:</strong> <span className="text-blue-400 break-all">{data.source_origin}</span></p>
                <p><strong>Key Terms Extracted:</strong> <span className="font-mono bg-gray-700 px-2 py-1 rounded">{data.extracted_terms.join(', ')}</span></p>
            </div>
            <p className="mt-6 text-xs text-center text-yellow-400 bg-yellow-900/50 p-2 rounded-lg">
                <strong>Disclaimer:</strong> This is NOT a substitute for professional medical advice.
            </p>
        </div>
    );
};

function App() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input) {
            setError('Please enter a URL or text to verify.');
            return;
        }
        setLoading(true);
        setResult(null);
        setError('');
        try {
            const response = await axios.post('http://127.0.0.1:5000/medverify/check', { input: input });
            setResult(response.data);
        } catch (err) {
            setError('Failed to connect to the backend. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                        Med-Verify
                    </h1>
                    <p className="text-gray-400 mt-2">Combating Medical Misinformation with AI</p>
                </div>
                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter article URL or paste text here..."
                        className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                        {loading ? 'Analyzing...' : 'Verify Claim'}
                    </button>
                </form>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                {loading && (
                    <div className="flex justify-center items-center mt-8">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div>
                    </div>
                )}
                {result && <ReportCard data={result} />}
            </div>
            <footer className="text-center text-gray-500 mt-12 text-sm">
                <p>Team Sudo Su | DSCE BRUTEFORCE Hackathon</p>
            </footer>
        </div>
    );
}
export default App;