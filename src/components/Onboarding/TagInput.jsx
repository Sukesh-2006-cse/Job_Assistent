import React, { useState } from 'react';
import './OnboardingPage.css';

const TagInput = ({ tags, setTags, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            if (!tags.includes(inputValue.trim())) {
                setTags([...tags, inputValue.trim()]);
            }
            setInputValue('');
        }
    };

    const removeTag = (indexToRemove) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="tag-input-container">
            <div className="tags-list">
                {tags.map((tag, index) => (
                    <span key={index} className="tag">
                        {tag}
                        <button type="button" onClick={() => removeTag(index)}>&times;</button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="tag-input"
            />
        </div>
    );
};

export default TagInput;
