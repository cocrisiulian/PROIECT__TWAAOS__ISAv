import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getFaculties } from '../../api/events.js';

function EventFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);
  const [useAdvancedOr, setUseAdvancedOr] = useState(!!searchParams.get('or_filters'));
  const [orGroupA, setOrGroupA] = useState({ category_id: '', faculty_id: '' });
  const [orGroupB, setOrGroupB] = useState({ category_id: '', faculty_id: '' });

  useEffect(() => {
    const raw = searchParams.get('or_filters');
    if (!raw) return;
    try {
      const groups = JSON.parse(raw);
      if (Array.isArray(groups)) {
        const a = groups[0] || {};
        const b = groups[1] || {};
        setOrGroupA({
          category_id: a.category_id ? String(a.category_id) : '',
          faculty_id: a.faculty_id ? String(a.faculty_id) : '',
        });
        setOrGroupB({
          category_id: b.category_id ? String(b.category_id) : '',
          faculty_id: b.faculty_id ? String(b.faculty_id) : '',
        });
      }
    } catch {
      // Ignore malformed URL state
    }
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  });

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties().then((r) => r.data),
  });

  const categories = categoriesData?.items || categoriesData || [];
  const faculties = facultiesData?.items || facultiesData || [];

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, value);
        next.set('page', '1');
      }
      return next;
    });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam('search', val);
    }, 300);
  };

  const clearAll = () => {
    setSearchText('');
    setUseAdvancedOr(false);
    setOrGroupA({ category_id: '', faculty_id: '' });
    setOrGroupB({ category_id: '', faculty_id: '' });
    setSearchParams({});
  };

  const updateOrFilters = (enabled, a, b) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!enabled) {
        next.delete('or_filters');
        return next;
      }
      const groups = [a, b]
        .map((g) => {
          const out = {};
          if (g.category_id) out.category_id = Number(g.category_id);
          if (g.faculty_id) out.faculty_id = Number(g.faculty_id);
          return out;
        })
        .filter((g) => Object.keys(g).length > 0);

      if (groups.length === 0) {
        next.delete('or_filters');
      } else {
        next.set('or_filters', JSON.stringify(groups));
        next.set('page', '1');
      }
      return next;
    });
  };

  return (
    <aside className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Filters</h3>
        <button
          onClick={clearAll}
          className="text-xs text-blue-600 hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search events..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
        <select
          value={searchParams.get('category_id') || ''}
          onChange={(e) => updateParam('category_id', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Faculty */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Faculty</label>
        <select
          value={searchParams.get('faculty_id') || ''}
          onChange={(e) => updateParam('faculty_id', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All faculties</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Participation Mode */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Participation Mode</label>
        <div className="space-y-1.5">
          {['', 'physical', 'online', 'hybrid'].map((mode) => (
            <label key={mode} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="participation_mode"
                value={mode}
                checked={(searchParams.get('participation_mode') || '') === mode}
                onChange={() => updateParam('participation_mode', mode)}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{mode === '' ? 'All' : mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={searchParams.get('is_free') === 'true'}
            onChange={(e) => updateParam('is_free', e.target.checked ? 'true' : '')}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Free events only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={searchParams.get('requires_registration') === 'true'}
            onChange={(e) => updateParam('requires_registration', e.target.checked ? 'true' : '')}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Registration required</span>
        </label>
      </div>

      {/* Date range */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
        <input
          type="date"
          value={searchParams.get('date_from') || ''}
          onChange={(e) => updateParam('date_from', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
        <input
          type="date"
          value={searchParams.get('date_to') || ''}
          onChange={(e) => updateParam('date_to', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Advanced OR filters */}
      <div className="pt-2 border-t border-gray-100 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useAdvancedOr}
            onChange={(e) => {
              const enabled = e.target.checked;
              setUseAdvancedOr(enabled);
              updateOrFilters(enabled, orGroupA, orGroupB);
            }}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Advanced OR (Group A OR Group B)</span>
        </label>

        {useAdvancedOr && (
          <>
            <div className="p-2 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-600">Group A (AND)</p>
              <select
                value={orGroupA.category_id}
                onChange={(e) => {
                  const next = { ...orGroupA, category_id: e.target.value };
                  setOrGroupA(next);
                  updateOrFilters(true, next, orGroupB);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any category</option>
                {categories.map((c) => (
                  <option key={`a-${c.id}`} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={orGroupA.faculty_id}
                onChange={(e) => {
                  const next = { ...orGroupA, faculty_id: e.target.value };
                  setOrGroupA(next);
                  updateOrFilters(true, next, orGroupB);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any faculty</option>
                {faculties.map((f) => (
                  <option key={`fa-${f.id}`} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="p-2 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-600">Group B (AND)</p>
              <select
                value={orGroupB.category_id}
                onChange={(e) => {
                  const next = { ...orGroupB, category_id: e.target.value };
                  setOrGroupB(next);
                  updateOrFilters(true, orGroupA, next);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any category</option>
                {categories.map((c) => (
                  <option key={`b-${c.id}`} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={orGroupB.faculty_id}
                onChange={(e) => {
                  const next = { ...orGroupB, faculty_id: e.target.value };
                  setOrGroupB(next);
                  updateOrFilters(true, orGroupA, next);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any faculty</option>
                {faculties.map((f) => (
                  <option key={`fb-${f.id}`} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default EventFilters;
