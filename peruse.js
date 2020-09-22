import _each from 'lodash/each';
import _map from 'lodash/map';
import _clone from 'lodash/clone';
import _reduce from 'lodash/reduce';
import _uniq from 'lodash/uniq';

import React from 'react';
import ReactDOM from 'react-dom';
import { Link, Route, HashRouter, Switch, withRouter } from 'react-router-dom';

import { Parser } from "./parser";
import { Chapter } from "./views/chapter";
import { TableOfContents } from "./views/toc";
import { References } from "./views/references";
import { Index } from "./views/index";
import { Search } from "./views/search";
import { Unknown } from "./views/unknown";

class Peruse extends React.Component {

	constructor(props) {

		super(props);

		// Start data as undefined, rending a loading state until it changes.
		this.state = {
			book: undefined,
			chapters: {},
			loadingTime: undefined
		};
		
		// Fetch the JSON
		fetch(this.props.book)
			.then(response => response.json())
			.then(data => {
				// Yay, we got data! Set the state, then fetch the chapters.
				this.setState({ book: data }, () => { 
					document.title = this.getTitle();
					this.fetchChapters(); 
				});
			})
			.catch(err => { 
				// Uh oh, something bad happened. Set data to null to render an error.
				this.setState({ book: null });
				console.error("Unable to load " + this.props.book + ": " + err);
			});

		this.index = null;
		
		// Lookup table for optmization
		this.chapterNumbers = {};

	}

	componentDidMount() {

		// Keep track of how long it's been since we started loading the book, so we can show feedback
		// if it's been more than a certain period of time. We'll check every 100 milliseconds.
		this.loadingStartTime = Date.now();
		this.loadingCheck = setInterval(() => { 

			this.setState({loadingTime: Date.now() - this.loadingStartTime});
			if(this.state.book !== null) {
				clearInterval(this.loadingCheck);
			}

		}, 100);

	}

	getBook() { return this.state.book; }
	getContent(chapterID) { return chapterID in this.state.chapters ? this.state.chapters[chapterID] : undefined; }
	getTitle() { return this.getBook().title; }
	getAuthors() { return this.getBook().authors.join(", "); }
	getContributors() { return this.getBook().contributors == null ? null : this.getBook().contributors.join(", "); }
	getDescription() { return this.getBook().description; }
	getRevisions() { return this.getBook().revisions; }
	getChapterReadingTime(chapterID) {  return chapterID in this.state.chapters ? Math.max(1, Math.round(this.state.chapters[chapterID].wordCount / 150)) : 0; }
	getBookReadingTime() {
		return _reduce(_map(Object.keys(this.state.chapters), chapterID => this.getChapterReadingTime(chapterID)), (total, count) => total + count);
	}
	getChapters() { return this.getBook().chapters; }
	getChapterNumber(chapterID) {
		if(!(chapterID in this.chapterNumbers)) {
			var chapterNumber = _map(this.getChapters(), chapter => chapter[1]).indexOf(chapterID);
			if(chapterNumber < 0) return null;
			else this.chapterNumbers[chapterID] = chapterNumber + 1;
		}
		return this.chapterNumbers[chapterID];
	}
	getSource(sourceID) { 
		return sourceID.charAt(0) === "#" && sourceID.substring(1) in this.getBook().sources ? this.getBook().sources[sourceID.substring(1)] : null;
	}
	getChapterName(chapterID) { return chapterID in this.state.chapters ? this.state.chapters[chapterID].title : null;	}
	getLoadedChapters() { return this.state.chapters; }
	chaptersAreLoaded() { return Object.keys(this.state.chapters).length === this.getBook().chapters.length; }
	getLicense() { return this.getBook().license; }
	getImage(image) {
		return {
			url: image[0],
			alt: image[1],
			caption: image[2],
			credit: image[3]
		}
	}
	getCover() { return this.getImage(this.getBook().cover); }
	getUnknown() { return this.getBook() ? this.getImage(this.getBook().unknown) : null; }
	getReferences() { return this.getBook().references; }

	computeIndex(text) {

		// Build a list of common words
		var commonWords = {};
		_each(["a","about","all","also","and","are","as","at","be","because","but","by","can","come","could","day","do","does","even","find","first","for","from","get","give","go","has","have","he","her","here","him","his","how","I","if","in","into","is","it","its","just","know","like","look","make","man","many","me","more","my","new","no","not","now","of","on","one","only","or","other","our","out","people","say","see","she","so","some","take","tell","than","that","the","their","them","then","there","these","they","thing","think","this","those","time","to","two","up","use","very","want","was","way","we","well","went","what","when","which","who","will","with","would","year","yes","you","your"],
			word => commonWords[word] = true);

		// Get all the text in the chapter.
        var text = Parser.parseChapter(text).toText();
		
		// Split by word boundaries.
		var words = text.split(/\b/);

		// Index the words
		var index = {};
		_each(words, (word, wordNumber) => {

			// Skip non words. We keep them for search results.
			if(!/[a-zA-Z\u2019]+/.test(word))
				return;
		
			word = word.toLowerCase();
			
			// Should we include?
			// • It shouldn't be a common word
			// • It shouldn't have an apostrophe
			// • It should be longer than two letters
			// • It shouldn't end in 'ly'
			if(!(word in commonWords) && word.indexOf('\u2019') < 0 && (word.length > 2 && word.substring(word.length - 2, word.length) !== "ly")) {
				
				// If we haven't started a list of occurences, start one.
				if(!(word in index))
					index[word] = [];
				
				var match = {
					left: words.slice(Math.max(0, wordNumber - 10), Math.max(0, wordNumber - 1) + 1).join(""),
					match: words[wordNumber],
					right: words.slice(Math.min(words.length - 1, wordNumber + 1), Math.min(words.length - 1, wordNumber + 10) + 1).join("")
				}
				// Add the occurence
				index[word].push(match);
			}
		
		});

		return this.cleanIndex(index);

	}

	cleanIndex(index) {

		// Remove any:
		// * upper case versions of words if they appear in lower case,
		// * plural versions of words if they appear in singular
		// as a heuristic for detecting non-proper nounds.
		var duplicates = [];
		_each(Object.keys(index), word => {
			var duplicate = false;
			var canonical = null;
			if((word.charAt(0) === word.charAt(0).toUpperCase() && word.toLowerCase() in index)) {
				duplicate = true;
				canonical = word.toLowerCase();
			}
			if(word.charAt(word.length - 1) === "s" && word.toLowerCase().substring(0, word.length - 1) in index) {
				duplicate = true;
				canonical = word.toLowerCase().substring(0, word.length - 1);
			}
			if(duplicate) {				
				duplicates.push(word);
				// Merge any chapter occurences
				if(Array.isArray(index[canonical]))
					index[canonical] = _uniq(index[canonical].concat(index[word]));
			}
		})
		_each(duplicates, word => {
			delete index[word];
		});

		return index;

	}

	getChapterIndex(chapterID) {
		return chapterID in this.state.chapters ? this.state.chapters[chapterID].index : null;
	}

	getBookIndex() {

		var bookIndex = {};

		// Construct the index.
		_each(this.state.chapters, chapter => {
			_each(Object.keys(chapter.index), (word) => {
				if(word !== "" && word.length > 2) {
					if(word in bookIndex)
						bookIndex[word].push(chapter.id);
					else
						bookIndex[word] = [chapter.id];
				}
			});
		});

		// Sort the chapter numbers for each word.
		_each(Object.keys(bookIndex), (word) => {
			bookIndex[word] = bookIndex[word].sort((a, b) => { return this.getChapterNumber(a) > this.getChapterNumber(b); });
		});

		return this.cleanIndex(bookIndex);

	}

	getNextChapter(id) {

		var chapters = this.getChapters();
		for(var i = 0; i < chapters.length; i++) {
			if(chapters[i][1] === id) {
				if(i < chapters.length - 1)
					return this.getContent(chapters[i + 1][1]);
				else
					return null;
			}
		}
		return null;

	}

	getPreviousChapter(id) {

		var chapters = this.getChapters();
		for(var i = 0; i < chapters.length; i++) {
			if(chapters[i][1] === id) {
				if(i > 0)
					return this.getContent(chapters[i - 1][1]);
				else
					return null;
			}
		}
		return null;

	}

	fetchChapters() {

		// Request all of the chapter content...
		_each(this.getChapters(), (chapter) => {

			var chapterID = chapter[1];

			fetch("chapters/" + chapterID + ".md")
				.then((response) => {
					// Uh oh, something bad happened. We couldn't load the chapter.
					if(response.ok) {
						response.text().then(text => {
							// Notify the component that we got a new chapter.
							var updatedChapters = _clone(this.state.chapters);
							updatedChapters[chapter[1]] = {
								title: chapter[0],
								text: text,
								wordCount: text.split(/\s+/).length,
								id: chapterID,
								image: {
									url: chapter[2],
									alt: chapter[3],
									caption: chapter[4],
									credit: chapter[5]
								},
								index: this.computeIndex(text)
							};
							this.setState({ chapters: updatedChapters });
						});
					}
					else {
						var updatedChapters = _clone(this.state.chapters);
						updatedChapters[chapter[1]] = null;
						this.setState({ chapters: updatedChapters });
					}
				})
				.catch(err => { 
					// Uh oh, something bad happened. We couldn't load the chapter.
					var updatedChapters = _clone(this.state.chapters);
					updatedChapters[chapter[1]] = null;
					// Notify the component that we got a new chapter.
					this.setState({ chapters: updatedChapters });
					// Tell the dev about the problem.
					console.error(err);
				});

		});

	}
	
	render() {
		
		// If it's loading, show loading feedback
		if(this.getBook() === undefined) {
			if(this.state.loadingTime === undefined || this.state.loadingTime < 500)
				return null;
			else
				return <div className="text-center text-muted" style={{position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, 0)"}}> Loading book...</div>;
		} 
		// If it failed to load, provide some feedback.
		else if(this.getBook() === null) {
			return <Unknown message={<p className="alert alert-danger">Wasn't able to load the book <code>{this.props.book}</code>. The book specification probably has a syntax error, but it's also possible that this file doesn't exist or there was a problem with the server.</p>} app={this} />;
		}
		// Render the book
		else 
			return (
				<Switch>
					<Route exact path="/" render={(props) => <TableOfContents {...props} app={this} />} />
					{
						// Map all the book chapters to routes
						_map(this.getChapters(), (chapter, index) => {
							return <Route key={"chapter" + index} path={"/" + chapter[1] + "/:word?/:number?"} render={(props) => <Chapter {...props} id={chapter[1]} app={this} />} />
						})
					}
					<Route path="/references" render={(props) => <References {...props} app={this} />} />
					<Route path="/index/:letter?" render={(props) => <Index {...props} app={this} />} />
					<Route path="/search/" render={(props) => <Search {...props} app={this} />} />
					<Route path="*" render={(props) => <Unknown {...props} message={<p>This URL doesn't exist for this book. Want to go back to the <Link to="/">Table of Contents?</Link></p>} app={this} />}/>
				</Switch>
			);

	}
	
}

var PeruseWithRouter = withRouter(Peruse);

window.peruse = function(url) {
	ReactDOM.render((
		<HashRouter>
			<Route path="/" render={(props) => <PeruseWithRouter {...props} book={url} /> } />
		</HashRouter>
	), document.body.appendChild(document.createElement("div")));
}