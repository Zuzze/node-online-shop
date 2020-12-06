// this code deletes the product from view after asyncronous delete request has been finished
// Otherwise user should refresh the page manually
//
// this can be added to view like this:
// <script src="/js/admin.js"></script>
// <button class="btn" type="button" onclick="deleteProduct(this)">Delete</button>
// button click triggers the script that deletes the product from view once async action finished
const deleteProduct = async btn => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  // select closest ancestor that is type of <article>
  const productElement = btn.closest("article");

  // note that DELETE cannot have a body
  fetch(`/admin/product/${prodId}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf
    }
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      console.log(data);
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
      console.log(err);
    });
};
