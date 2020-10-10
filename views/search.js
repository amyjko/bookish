import _each from 'lodash/each';
import _map from 'lodash/map';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link';

class Search extends React.Component {

    constructor(props) {
        super(props);
        this.state = { query: ""}
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleQueryChange(event) {
        this.setState({query: event.target.value});
    }

    handleKeyDown(event) {
        if(event.key === " ") {
            event.preventDefault();
        }
    }

    componentDidMount() {
        this.queryInput.focus();
    }

	render() {

        var results = [];
        var query = this.state.query.toLowerCase();
        var matchCount = 0;

        // Go through all the chapter indexes and find matches.
        if(query.length > 2)
            _each(this.props.app.getChapters(), (chapter, chapterNumber) => {
                var chapterID = chapter.id;
                var index = this.props.app.getChapterIndex(chapterID);

                // No index yet? Skip this chapter.
                if(index === null)
                    return;

                // Build a DOM to render matches.
                var chapterMatches = [];

                // What are all of the words in the index that match the query?
                _map(Object.keys(index), word => {
                    if(query.length > 0 && word.indexOf(query) >= 0) {
                        _each(index[word], match => {
                            chapterMatches.push(match);
                        });
                    }
                });

                matchCount += chapterMatches.length;

                if(chapterMatches.length > 0) {
                    results.push(<h2 key={"header-" + chapterID}>Chapter {chapterNumber+1} - {chapter.title}</h2>);
                    _each(chapterMatches, (match, index) => {
                        // Only highlight the part of the word that matches.
                        var start = match.match.indexOf(query);
                        var left = match.left + match.match.substring(0, start);
                        var wordMatch = <span className="query-match">{match.match.substring(start, start + query.length)}</span>;
                        var right = match.match.substring(start + query.length) + match.right;

                        results.push(<p key={"header-" + chapterID + "-" + index}><Link to={"/" + chapterID + "/" + match.match.toLowerCase() + "/" + index}>...{left}{wordMatch}{right}...</Link></p>);
                    })
                }

            });

		return (
			<div>
				<h1>Search</h1>
                <NavHashLink to={"/#toc"}>Table of Contents</NavHashLink>

                <p>Type a word—just a single word—and we'll show its occurrences in this book:</p>

                <p>
                    <input 
                        className="form-control" 
                        type="text" 
                        name="query" 
                        value={this.state.value} 
                        onChange={this.handleQueryChange}
                        onKeyDown={this.handleKeyDown}
                        placeholder={"search for a word"} 
                        ref={(input)=>{this.queryInput = input}}>
                    </input>
                </p>

                {
                    this.state.query === "" ? null :
                    this.state.query.length < 3 ? <p>Keep typing...</p> :
                    results.length === 0 ? <p>No occurrence of <em>{this.state.query}</em>.</p> :
                    (
                        <div>
                            <p>Found {matchCount} occurrences of <em>{this.state.query}</em>...</p>
                            {results}
                        </div>
                    )
                }
				<div className="navigation-footer">
					<Link to={"/"}>Table of Contents</Link>
				</div>
            </div>
		);

	}

}

export {Search};