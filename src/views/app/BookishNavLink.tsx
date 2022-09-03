import React from "react"
import { NavLink } from "react-router-dom"

export default function BookishNavLink(props: { to: string, children: React.ReactNode }) {

	return <NavLink to={props.to} className={({ isActive }) => isActive ? "bookish-link-inactive" : ""}>{ props.children }</NavLink>;

}