
import React from 'react';
import { Draft } from '../../types/payload';
import ImageUpload from './ImageUpload';
import QuizAuthoring from './QuizAuthoring';
import { useAuth } from '../../contexts/AuthContext';

interface EditorSettingsDrawerProps {
    activeSection: 'menu' | 'cover' | 'tags' | 'quiz' | 'details' | null;
    onClose: () => void;
    currentDraft: Draft;
    onChange: (updates: Partial<Draft>) => void;
    tagsInput: string;
    setTagsInput: (value: string) => void;
}

const EditorSettingsDrawer: React.FC<EditorSettingsDrawerProps> = ({
    activeSection,
    onClose,
    currentDraft,
    onChange,
    tagsInput,
    setTagsInput
}) => {
    const { state: authState } = useAuth();
    const canUseCustomAuthor = authState.user?.role === 'editor' || authState.user?.role === 'admin';

    // Only render if activeSection is present
    if (!activeSection) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end md:justify-end items-end md:items-start group">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className={`
                relative w-full bg-dark-950 border-t md:border-t-0 md:border-l border-dark-800 
                rounded-t-2xl md:rounded-t-none md:rounded-l-2xl 
                shadow-2xl 
                flex flex-col
                max-h-[85vh] md:h-full md:max-h-full md:w-[480px]
                animate-in slide-in-from-bottom md:slide-in-from-right duration-300
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-800">
                    <h3 className="text-lg font-semibold text-white">
                        {activeSection === 'menu' && 'Article Settings'}
                        {activeSection === 'cover' && 'Cover Image'}
                        {activeSection === 'tags' && 'Tags'}
                        {activeSection === 'quiz' && 'Quiz Builder'}
                        {activeSection === 'details' && 'Event Details'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-800 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="text-sm font-bold">Close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeSection === 'menu' && (
                        <div className="space-y-2">
                            <div className="text-center text-gray-500 text-sm py-8 space-y-2">
                                <p>Desktop: Use the toolbar to open specific settings.</p>
                                <p>Mobile: Select an option from the bottom bar.</p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'cover' && (
                        <div className="space-y-6">
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800">
                                <ImageUpload
                                    currentImage={currentDraft.coverImage}
                                    onImageChange={(url) => onChange({ coverImage: url })}
                                    onImageRemove={() => onChange({ coverImage: undefined })}
                                    placeholder="Upload cover image"
                                    className="w-full"
                                />
                            </div>

                            {/* Custom Author - allowed for editor/admin roles */}
                            {currentDraft && canUseCustomAuthor && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        External Author (Competition)
                                    </label>
                                    <input
                                        type="text"
                                        value={currentDraft.customAuthor || ''}
                                        onChange={(e) => onChange({ customAuthor: e.target.value })}
                                        placeholder="Original Author Name"
                                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                    <p className="text-xs text-gray-500">
                                        This name will appear as the author instead of your profile.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-start gap-3 p-4 bg-primary-900/10 rounded-lg border border-primary-500/10">

                                <div>
                                    <h4 className="text-sm font-medium text-primary-300 mb-1">Why add a cover?</h4>
                                    <p className="text-xs text-primary-200/70 leading-relaxed">
                                        Articles with cover images get 2x more views. It appears on your article card and at the top of the page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'tags' && (
                        <div className="space-y-6">
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Add Tags
                                    </label>
                                    <div className="relative">

                                        <input
                                            type="text"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                                    if (newTags.length) {
                                                        const current = currentDraft.tags || [];
                                                        onChange({ tags: [...new Set([...current, ...newTags])] });
                                                        setTagsInput('');
                                                    }
                                                }
                                            }}
                                            placeholder="Type tag and press Enter..."
                                            className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                        Separate with commas or press Enter
                                    </p>
                                </div>
                                {/* Default Tags */}
                                <div className="flex flex-wrap gap-2 pt-2 pb-2">
                                    {['Robotics', 'IoT', 'Hackathon', 'AI', 'UI/UX'].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                const current = currentDraft.tags || [];
                                                if (!current.includes(tag)) {
                                                    onChange({ tags: [...current, tag] });
                                                }
                                            }}
                                            className="px-2 py-1 text-xs border border-dark-700 rounded bg-dark-800 text-gray-300 hover:text-white"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>

                                {/* Current Tags */}
                                {(currentDraft.tags || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {currentDraft.tags?.map((tag, i) => (
                                            <span key={i} className="group inline-flex items-center gap-1 px-3 py-1 bg-primary-900/20 text-primary-400 rounded-full text-sm border border-primary-500/20">
                                                <span>#{tag}</span>
                                                <button
                                                    onClick={() => {
                                                        const newTags = currentDraft.tags?.filter(t => t !== tag);
                                                        onChange({ tags: newTags });
                                                    }}
                                                    className="hover:text-white transition-colors"
                                                >
                                                    <span className="text-xs font-bold px-1">x</span>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'quiz' && (
                        <div className="pb-4">
                            <div className="mb-4 flex items-start gap-3 p-3 bg-primary-900/10 rounded-lg border border-primary-500/10">

                                <div>
                                    <h4 className="text-xs font-medium text-primary-300 mb-0.5">Interactive Quiz</h4>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Add questions to engage readers. Use Generate with AI to create from your content.
                                    </p>
                                </div>
                            </div>

                            <QuizAuthoring
                                articleHtml={currentDraft.contentHtml || ''}
                                maxQuestions={10}
                                initialQuestions={(currentDraft as any).quizQuestions || []}
                                onChange={(qs) => onChange({ quizQuestions: qs } as any)}
                            />
                        </div>
                    )}

                    {activeSection === 'details' && (
                        <div className="space-y-6">
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Event Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={currentDraft.event_date ? new Date(currentDraft.event_date).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => onChange({ event_date: new Date(e.target.value).toISOString() })}
                                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                                    <input
                                        type="text"
                                        value={currentDraft.venue || ''}
                                        onChange={(e) => onChange({ venue: e.target.value })}
                                        placeholder="e.g. Main Auditorium"
                                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Registration Link</label>
                                    <input
                                        type="url"
                                        value={currentDraft.registration_link || ''}
                                        onChange={(e) => onChange({ registration_link: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Team Size</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={currentDraft.max_team_size || ''}
                                        onChange={(e) => onChange({ max_team_size: parseInt(e.target.value) || undefined })}
                                        placeholder="e.g. 4"
                                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorSettingsDrawer;
