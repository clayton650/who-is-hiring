//** Misc **
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


//** Working with URL parameters **
function parse_url(a) {
    // Generic function to convert url query string to javascript object
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p=a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}


function get_urlquery(){
    // This function will get the current url and parse url query (?)
    var urlquery = window.location.search.substr(1).split('&');
    var urlquery = parse_url(urlquery);
    return urlquery;
}


function array_to_urlquery(parameter_array){
    //convert a parameter array into a string that is ready to be appended to a url
    // ie:
    //      input:  ['tab=shared','user=all']
    //      output: '?tab=shared&user=all'

    var array_length = parameter_array.length;
    var urlquery;

    if(array_length > 1){
        urlquery = '?'+parameter_array.join('&');
    }else if(array_length==1){
        urlquery = '?'+parameter_array[0];
    }else{
        urlquery = '';
    }

    return urlquery;

}