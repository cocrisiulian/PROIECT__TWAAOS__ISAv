import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { submitFeedback } from '../../api/events.js';

export default function FeedbackForm({ eventId }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationKey: ['event', eventId],
    mutationFn: () => submitFeedback(eventId, { rating, comment }),
    onSuccess: () => { toast.success(t('events.feedback.success')); setSubmitted(true); },
    onError: (err) => toast.error(err.response?.data?.detail || t('events.feedback.error')),
  });

  if (submitted) return <p className="text-green-600 text-sm">{t('events.feedback.success')}</p>;

  return (
    <div className="space-y-4">
      {/* Stars */}
      <div>
        <p className="text-sm text-gray-600 mb-2">{t('events.feedback.rating')}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-3xl leading-none"
            >
              <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-xs text-gray-500 mt-1">{rating} / 5</p>}
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">{t('events.feedback.comment')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Share your experience..."
        />
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={rating === 0 || mutation.isPending}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {mutation.isPending ? t('events.feedback.submit') + '…' : t('events.feedback.submit')}
      </button>
    </div>
  );
}
