import _ from 'lodash';
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
			chapters: {}
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

	getBook() { return this.state.book; }
	getContent(chapterID) { return _.has(this.state.chapters, chapterID) ? this.state.chapters[chapterID] : undefined; }
	getTitle() { return this.getBook().title; }
	getAuthors() { return this.getBook().authors.join(", "); }
	getContributors() { return this.getBook().contributors == null ? null : this.getBook().contributors.join(", "); }
	getDescription() { return this.getBook().description; }
	getRevisions() { return this.getBook().revisions; }
	getChapterReadingTime(chapterID) {  return _.has(this.state.chapters, chapterID) ? Math.max(1, Math.round(this.state.chapters[chapterID].wordCount / 150)) : 0; }
	getBookReadingTime() {
		return _.reduce(_.map(Object.keys(this.state.chapters), chapterID => this.getChapterReadingTime(chapterID)), (total, count) => total + count);
	}
	getChapters() { return this.getBook().chapters; }
	getChapterNumber(chapterID) {
		if(!(chapterID in this.chapterNumbers)) {
			var chapterNumber = _.map(this.getChapters(), chapter => chapter[1]).indexOf(chapterID);
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
		var commonWords = _.keyBy(["a","about","all","also","and","are","as","at","be","because","but","by","can","come","could","day","do","does","even","find","first","for","from","get","give","go","has","have","he","her","here","him","his","how","I","if","in","into","is","it","its","just","know","like","look","make","man","many","me","more","my","new","no","not","now","of","on","one","only","or","other","our","out","people","say","see","she","so","some","take","tell","than","that","the","their","them","then","there","these","they","thing","think","this","those","time","to","two","up","use","very","want","was","way","we","well","went","what","when","which","who","will","with","would","year","yes","you","your"]);

		// Get all the text in the chapter.
        var text = Parser.parseChapter(text).toText();
		
		// Remove all non-letters, non-apostrophes
		text = text.trim().replace(/[^a-zA-Z\u2019.]/g, ' ');

		// Split by spaces.
		var words = text.split(/(\.|\s+)/);

		// Index the words
		var index = {};
		_.each(words, (word, wordNumber) => {

			// Skip the periods. But we need them to match sentence boundaries.
			if(word === ".")
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
					left: words.slice(Math.max(0, wordNumber - 5), Math.max(0, wordNumber - 1) + 1),
					match: words[wordNumber],
					right: words.slice(Math.min(words.length - 1, wordNumber + 1), Math.min(words.length - 1, wordNumber + 5) + 1)
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
		_.each(Object.keys(index), word => {
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
					index[canonical] = _.uniq(index[canonical].concat(index[word]));
			}
		})
		_.each(duplicates, word => {
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
		_.each(this.state.chapters, chapter => {
			_.each(_.keys(chapter.index), (word) => {
				if(word !== "" && word.length > 2) {
					if(_.has(bookIndex, word))
						bookIndex[word].push(chapter.id);
					else
						bookIndex[word] = [chapter.id];
				}
			});
		});

		// Sort the chapter numbers for each word.
		_.each(Object.keys(bookIndex), (word) => {
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
		_.each(this.getChapters(), (chapter) => {

			var chapterID = chapter[1];

			fetch("chapters/" + chapterID + ".md")
				.then((response) => {
					// Uh oh, something bad happened. We couldn't load the chapter.
					if(response.ok) {
						response.text().then(text => {
							// Notify the component that we got a new chapter.
							var updatedChapters = _.clone(this.state.chapters);
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
						var updatedChapters = _.clone(this.state.chapters);
						updatedChapters[chapter[1]] = null;
						this.setState({ chapters: updatedChapters });
					}
				})
				.catch(err => { 
					// Uh oh, something bad happened. We couldn't load the chapter.
					var updatedChapters = _.clone(this.state.chapters);
					updatedChapters[chapter[1]] = null;
					// Notify the component that we got a new chapter.
					this.setState({ chapters: updatedChapters });
					// Tell the dev about the problem.
					console.error(err);
				});

		});

	}
	
	render() {
		
		// Return the single page app.
		return (
		
			// If it's loading, show loading feedback
			this.getBook() === undefined ?
				<p>...</p> :
			// If it failed to load, provide some feedback.
			this.getBook() === null ?
				<Unknown message={<p className="alert alert-danger">Wasn't able to load the book <code>{this.props.book}</code>. The book specification probably has a syntax error, but it's also possible that this file doesn't exist or there was a problem with the server.</p>} app={this} /> :
				<Switch>
					<Route exact path="/" render={(props) => <TableOfContents {...props} app={this} />} />
					{
						// Map all the book chapters to routes
						_.map(this.getChapters(), (chapter, index) => {
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