import React, { useState } from 'react';
import { useState as useStateHook } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const GitHubAnalyzer = () => {
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api/v1/github/analyze`,
        { github_url: githubUrl.trim() }
      );

      setResult(response.data);
      toast.success('Repository analysis completed!');
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyze repository';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGithubUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            GitHub Repository Analyzer
          </h1>
          <p className="text-gray-600">
            Analyze GitHub repositories for code metrics, language distribution, and project statistics.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/tiangolo/fastapi"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Example: https://github.com/facebook/react
              </p>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600">Analyzing repository...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">Analysis Failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Repository Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {result.info.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Stars</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {result.info.stars.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Forks</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.info.forks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Language</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.info.language || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {Math.round(result.info.size_kb / 1024)} MB
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-700">
                  {result.info.description || 'No description provided'}
                </p>
              </div>
              {result.info.topics.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {result.info.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Code Analysis Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Code Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">README</p>
                  <p className={`text-lg font-bold ${result.analysis.readme_exists ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.analysis.readme_exists ? '✓ Present' : '✗ Missing'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Tests</p>
                  <p className={`text-lg font-bold ${result.analysis.has_tests ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.analysis.has_tests ? '✓ Found' : '✗ None'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">CI/CD</p>
                  <p className={`text-lg font-bold ${result.analysis.has_ci ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.analysis.has_ci ? '✓ Configured' : '✗ None'}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Docker</p>
                  <p className={`text-lg font-bold ${result.analysis.has_dockerfile ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.analysis.has_dockerfile ? '✓ Found' : '✗ None'}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Documentation</p>
                  <p className={`text-lg font-bold ${result.analysis.has_docs ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.analysis.has_docs ? '✓ Found' : '✗ None'}
                  </p>
                </div>
                {result.info.license && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">License</p>
                    <p className="text-lg font-bold text-blue-600">{result.info.license}</p>
                  </div>
                )}
              </div>

              {/* Languages */}
              {Object.keys(result.analysis.languages).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600 mb-3">Languages</p>
                  <div className="space-y-2">
                    {Object.entries(result.analysis.languages)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([lang, bytes]) => {
                        const total = Object.values(result.analysis.languages).reduce((a, b) => a + b, 0);
                        const percentage = Math.round((bytes / total) * 100);
                        return (
                          <div key={lang}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{lang}</span>
                              <span className="text-sm text-gray-600">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                View on GitHub
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubAnalyzer;
