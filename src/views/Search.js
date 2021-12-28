import React from 'react';
import { ChapterHeader } from "./ChapterHeader";
import { Outline } from './Outline';
import { Page } from './Page';

import { Link } from 'react-router-dom';
import Book from '../models/Book';

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

        let book = this.props.app.getBook();

        const results = [];
        const query = this.state.query.toLowerCase();
        let matchCount = 0;

        // Go through all the chapter indexes and find matches.
        if(query.length > 2)
            book.getChapters().forEach(chapter => {
                let chapterID = chapter.id;
                let index = book.getChapter(chapterID).getIndex();
                let chapterNumber = book.getChapterNumber(chapterID);

                // No index yet? Skip this chapter.
                if(index === null)
                    return;

                // Build a DOM to render matches.
                const chapterMatches = [];

                // What are all of the words in the index that match the query?
                Object.keys(index).forEach(word => {
                    if(query.length > 0 && word.indexOf(query) >= 0) {
                        index[word].forEach(match => {
                            chapterMatches.push(match);
                        });
                    }
                });

                matchCount += chapterMatches.length;

                if(chapterMatches.length > 0) {
                    results.push(<h2 key={"header-" + chapterID} className="header" id={"header-" + chapterID}>Chapter{chapterNumber === undefined ? "" : " " + chapterNumber} - {chapter.title}</h2>);
                    chapterMatches.forEach((match, index) => {
                        // Only highlight the part of the word that matches.
                        const start = match.match.toLowerCase().indexOf(query);
                        const left = match.left + match.match.substring(0, start);
                        const wordMatch = <span className="content-highlight">{match.match.substring(start, start + query.length)}</span>;
                        const right = match.match.substring(start + query.length) + match.right;

                        results.push(<p key={"header-" + chapterID + "-" + index}><Link to={"/" + chapterID + "/" + match.match.toLowerCase() + "/" + index}>...{left}{wordMatch}{right}...</Link></p>);
                    })
                }

            });

		return (
			<Page>
				<ChapterHeader 
                    book={book}
					image={book.getImage(Book.SearchID)} 
					header="Search"
					tags={book.getTags()}
				/>

                <Outline
                    previous={book.getPreviousChapterID(Book.SearchID)}
                    next={book.getNextChapterID(Book.SearchID)}
				/>

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

            </Page>
		);

	}

}

export {Search};