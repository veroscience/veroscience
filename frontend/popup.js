
function popup_info(id)
{
    display_value = d3.select("#"+id+"_info").style("display")=="block"? "none":"block";
    d3.select("#"+id+"_info").style("display", display_value)
}


function close_info(button)
{
    button.parentElement.style.display = "none";    
}

// // Make the DIV element draggable:
 dragElement(document.getElementById("about_info"));
 dragElement(document.getElementById("source_info"));