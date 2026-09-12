import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Event, ImportantDate } from '../types/payload';
import { eventsService } from '../services/eventsService';
import { storageService } from '../services/storageService';
import TiptapEditor from '../components/write/TiptapEditor';
import { useToast } from '../hooks/useToast';

const WriteDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [currentEvent, setCurrentEvent] = useState<Partial<Event> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const defaultTags = ['Robotics', 'IoT', 'Hackathon', 'AI', 'UI/UX'];
  const eventCategories = ['Workshops', 'Competitions', 'Meetups'];

  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.id) {
      loadMyEvents();
    }
  }, [authState.isAuthenticated, authState.user?.id]);

  const loadMyEvents = async () => {
    setLoading(true);
    try {
      const events = await eventsService.listMyEvents(authState.user!.id);
      setMyEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
      showError('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setCurrentEvent({
      title: '',
      description: '',
      tags: [],
      important_dates: [],
      category: 'Workshops',
    });
    setActiveView('form');
  };

  const handleEdit = (event: Event) => {
    setCurrentEvent(event);
    setActiveView('form');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await storageService.uploadImage(file, 'events');
      setCurrentEvent(prev => prev ? { ...prev, cover_image: result.url } : null);
      showSuccess('Cover image uploaded successfully');
    } catch (error: any) {
      console.error('Image upload failed:', error);
      showError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const toggleTag = (tag: string) => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = customTagInput.trim();
      if (newTag) {
        setCurrentEvent(prev => {
          if (!prev) return prev;
          const currentTags = prev.tags || [];
          if (!currentTags.includes(newTag)) {
            return { ...prev, tags: [...currentTags, newTag] };
          }
          return prev;
        });
        setCustomTagInput('');
      }
    }
  };

  const addImportantDate = () => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const newDate: ImportantDate = { label: '', date_value: '', is_primary: false };
      return { ...prev, important_dates: [...(prev.important_dates || []), newDate] };
    });
  };

  const removeImportantDate = (index: number) => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const dates = [...(prev.important_dates || [])];
      dates.splice(index, 1);
      return { ...prev, important_dates: dates };
    });
  };

  const updateImportantDate = (index: number, field: keyof ImportantDate, value: any) => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const dates = [...(prev.important_dates || [])];
      
      if (field === 'is_primary' && value === true) {
        dates.forEach(d => d.is_primary = false);
      }
      
      dates[index] = { ...dates[index], [field]: value };
      return { ...prev, important_dates: dates };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent?.title || !currentEvent.description || !currentEvent.event_date || !currentEvent.venue) {
      showError('Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (currentEvent.id) {
        await eventsService.updateEvent(currentEvent.id, currentEvent);
        showSuccess('Event updated successfully! It is now pending OC review.');
      } else {
        await eventsService.submitEvent(currentEvent, authState.user!.id);
        showSuccess('Event submitted successfully! It is now pending OC review.');
      }
      setActiveView('list');
      loadMyEvents();
    } catch (error) {
      console.error('Submission failed:', error);
      showError('Failed to submit event');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to start</h1>
          <p className="text-gray-400">Sign in to submit and manage your events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 px-4 py-8">
      <div className="max-w-4xl mx-auto w-full">
        {activeView === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Your Submitted Events</h1>
              <button 
                onClick={handleStartNew}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                Start New Event
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading events...</p>
            ) : myEvents.length > 0 ? (
              <div className="grid gap-4">
                {myEvents.map(event => (
                  <div key={event.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">{event.title}</h3>
                      <p className="text-sm text-gray-400">
                        Date: {new Date(event.event_date).toLocaleDateString()} | Venue: {event.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                        event.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                        event.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {event.status}
                      </span>
                      <button 
                        onClick={() => handleEdit(event)}
                        className="text-primary-400 hover:text-primary-300 font-medium text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-900 border border-dark-800 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">You haven't submitted any events yet.</p>
                <button 
                  onClick={handleStartNew}
                  className="text-primary-400 font-bold hover:underline"
                >
                  Create your first event
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'form' && currentEvent && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-bold text-white">
                {currentEvent.id ? 'Edit Event' : 'New Event'}
              </h1>
              <button 
                onClick={() => setActiveView('list')}
                className="text-gray-400 hover:text-white font-medium transition-colors"
              >
                Back to List
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-6">
              
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Category *</label>
                <div className="flex flex-wrap gap-4">
                  {eventCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCurrentEvent({ ...currentEvent, category: cat })}
                      className={`px-6 py-2 rounded-lg font-bold border transition-colors ${
                        currentEvent.category === cat
                        ? 'bg-primary-900/50 text-primary-400 border-primary-500/50'
                        : 'bg-dark-950 text-gray-400 border-dark-700 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Flyer / Cover Image</label>
                {currentEvent.cover_image ? (
                  <div className="relative w-full h-48 bg-dark-950 rounded-lg overflow-hidden border border-dark-700 mb-2">
                    <img src={currentEvent.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setCurrentEvent({ ...currentEvent, cover_image: undefined })}
                      className="absolute top-2 right-2 bg-dark-900/80 text-white px-2 py-1 rounded text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 disabled:opacity-50"
                    />
                    {uploadingImage && <p className="text-xs text-primary-400 mt-2">Uploading...</p>}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Title *</label>
                <input
                  type="text"
                  required
                  value={currentEvent.title || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                  placeholder="e.g., Annual Tech Hackathon"
                  className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              {/* Description (Tiptap) */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Description *</label>
                <div className="border border-dark-700 rounded-lg overflow-hidden bg-dark-950">
                  <TiptapEditor
                    value={currentEvent.description || ''}
                    onChange={(html) => setCurrentEvent({ ...currentEvent, description: html })}
                    placeholder="Describe your event..."
                    className="prose-invert max-w-none p-4 min-h-[200px] outline-none"
                  />
                </div>
              </div>

              {/* Standard Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={currentEvent.event_date ? new Date(currentEvent.event_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: new Date(e.target.value).toISOString() })}
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Venue *</label>
                  <input
                    type="text"
                    required
                    value={currentEvent.venue || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, venue: e.target.value })}
                    placeholder="e.g., Main Auditorium"
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Registration Link</label>
                  <input
                    type="url"
                    value={currentEvent.registration_link || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, registration_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Max Team Size</label>
                  <input
                    type="number"
                    min="1"
                    value={currentEvent.max_team_size || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, max_team_size: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 4"
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Important Dates */}
              <div className="border-t border-dark-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold text-gray-300">Important Dates</label>
                  <button 
                    type="button" 
                    onClick={addImportantDate}
                    className="text-primary-400 hover:text-primary-300 text-sm font-bold"
                  >
                    + Add Date
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(currentEvent.important_dates || []).map((date, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-dark-950 p-4 rounded-lg border border-dark-700">
                      <div className="w-full md:flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Label</label>
                        <input
                          type="text"
                          required
                          value={date.label}
                          onChange={(e) => updateImportantDate(index, 'label', e.target.value)}
                          placeholder="e.g., Registration Deadline"
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div className="w-full md:flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={date.date_value ? new Date(date.date_value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => updateImportantDate(index, 'date_value', new Date(e.target.value).toISOString())}
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-4 pb-2">
                        <button
                          type="button"
                          onClick={() => updateImportantDate(index, 'is_primary', !date.is_primary)}
                          className={`text-sm font-bold ${date.is_primary ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {date.is_primary ? '[x] Primary' : '[ ] Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImportantDate(index)}
                          className="text-red-400 hover:text-red-300 text-sm font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!currentEvent.important_dates || currentEvent.important_dates.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No important dates added.</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="border-t border-dark-800 pt-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">Tags</label>
                
                {/* Selected Tags Display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(currentEvent.tags || []).map(tag => (
                    <span
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded text-sm font-bold border bg-primary-900/30 text-primary-400 border-primary-500/30 cursor-pointer hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-2"
                      title="Click to remove"
                    >
                      {tag} <span className="font-mono">x</span>
                    </span>
                  ))}
                  {(!currentEvent.tags || currentEvent.tags.length === 0) && (
                    <span className="text-sm text-gray-500">No tags selected.</span>
                  )}
                </div>

                {/* Suggestions */}
                <div className="mb-4">
                  <span className="text-xs text-gray-400 mr-3">Suggestions:</span>
                  <div className="inline-flex flex-wrap gap-2">
                    {defaultTags.map(tag => {
                      if ((currentEvent.tags || []).includes(tag)) return null;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="px-2 py-1 rounded text-xs font-bold border bg-dark-950 text-gray-400 border-dark-700 hover:text-white transition-colors"
                        >
                          + {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div>
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder="Type a custom tag and press Enter..."
                    className="w-full md:w-1/2 bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-6 border-t border-dark-800 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-6 py-2 rounded-lg font-bold text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Event'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteDashboard;